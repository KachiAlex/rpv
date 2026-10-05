import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyBearerToken, getUserRole } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

let tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS blog_posts (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL DEFAULT '',
          excerpt TEXT NOT NULL DEFAULT '',
          slug TEXT NOT NULL UNIQUE,
          author TEXT NOT NULL DEFAULT '',
          author_name TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'draft',
          published_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          tags JSONB NOT NULL DEFAULT '[]',
          featured_image TEXT,
          video_embeds JSONB NOT NULL DEFAULT '[]',
          seo_title TEXT,
          seo_description TEXT
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts (status, published_at DESC)`;
    })().catch((err) => {
      tableReady = null;
      throw err;
    });
  }
  return tableReady;
}

function mapRow(r: any) {
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    excerpt: r.excerpt,
    slug: r.slug,
    author: r.author,
    authorName: r.author_name,
    status: r.status,
    publishedAt: r.published_at ? new Date(r.published_at).toISOString() : null,
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
    tags: Array.isArray(r.tags) ? r.tags : [],
    featuredImage: r.featured_image || undefined,
    videoEmbeds: Array.isArray(r.video_embeds) ? r.video_embeds : [],
    seoTitle: r.seo_title || undefined,
    seoDescription: r.seo_description || undefined,
  };
}

async function requireAdmin(request: NextRequest): Promise<boolean> {
  try {
    const user = await verifyBearerToken(request);
    return (await getUserRole(user.uid)) === 'admin';
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureTable();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    const status = searchParams.get('status');
    const author = searchParams.get('author');
    const search = searchParams.get('search');
    const includeUnpublished = searchParams.get('includeUnpublished') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);

    // Elevated views require admin
    const wantsElevated =
      (status && status !== 'published') || author || includeUnpublished;
    const isAdmin = wantsElevated ? await requireAdmin(request) : false;
    if (wantsElevated && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (id) {
      const result = await sql`SELECT * FROM blog_posts WHERE id = ${id} LIMIT 1`;
      const post = result.rows[0] ? mapRow(result.rows[0]) : null;
      if (post && post.status !== 'published' && !isAdmin) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json({ post });
    }

    if (slug) {
      const result = await sql`SELECT * FROM blog_posts WHERE slug = ${slug} LIMIT 1`;
      const post = result.rows[0] ? mapRow(result.rows[0]) : null;
      if (post && post.status !== 'published' && !isAdmin) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json({ post });
    }

    let result;
    if (search) {
      const term = `%${search}%`;
      if (includeUnpublished && isAdmin) {
        result = await sql`
          SELECT * FROM blog_posts
          WHERE title ILIKE ${term} OR excerpt ILIKE ${term} OR content ILIKE ${term}
          ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      } else {
        result = await sql`
          SELECT * FROM blog_posts
          WHERE status = 'published'
            AND (title ILIKE ${term} OR excerpt ILIKE ${term} OR content ILIKE ${term})
          ORDER BY published_at DESC NULLS LAST, created_at DESC
          LIMIT ${limit} OFFSET ${offset}`;
      }
    } else if (author) {
      result = await sql`
        SELECT * FROM blog_posts WHERE author = ${author}
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (status === 'all' || status === 'draft' || status === 'archived') {
      if (status === 'all') {
        result = await sql`
          SELECT * FROM blog_posts ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      } else {
        result = await sql`
          SELECT * FROM blog_posts WHERE status = ${status}
          ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      }
    } else {
      result = await sql`
        SELECT * FROM blog_posts WHERE status = 'published'
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT ${limit + 1} OFFSET ${offset}`;
      const hasMore = result.rows.length > limit;
      const posts = result.rows.slice(0, limit).map(mapRow);
      return NextResponse.json({ posts, hasMore });
    }

    return NextResponse.json({ posts: result.rows.map(mapRow), hasMore: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Blog GET error:', message);
    return NextResponse.json({ posts: [], hasMore: false });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTable();
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;
    const now = new Date().toISOString();

    if (action === 'create') {
      const { post } = body;
      const id = `post_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      await sql`
        INSERT INTO blog_posts
          (id, title, content, excerpt, slug, author, author_name, status, published_at,
           created_at, updated_at, tags, featured_image, video_embeds, seo_title, seo_description)
        VALUES (
          ${id}, ${post.title}, ${post.content || ''}, ${post.excerpt || ''}, ${post.slug},
          ${post.author || ''}, ${post.authorName || ''}, ${post.status || 'draft'},
          ${post.publishedAt ? new Date(post.publishedAt).toISOString() : (post.status === 'published' ? now : null)},
          ${now}, ${now},
          ${JSON.stringify(post.tags || [])}::jsonb,
          ${post.featuredImage || null},
          ${JSON.stringify(post.videoEmbeds || [])}::jsonb,
          ${post.seoTitle || null}, ${post.seoDescription || null}
        )`;
      return NextResponse.json({ id });
    }

    if (action === 'update') {
      const { id, updates } = body;
      await sql`
        UPDATE blog_posts SET
          title = COALESCE(${updates.title ?? null}, title),
          content = COALESCE(${updates.content ?? null}, content),
          excerpt = COALESCE(${updates.excerpt ?? null}, excerpt),
          slug = COALESCE(${updates.slug ?? null}, slug),
          author_name = COALESCE(${updates.authorName ?? null}, author_name),
          status = COALESCE(${updates.status ?? null}, status),
          published_at = CASE
            WHEN ${updates.status ?? null} IS NOT NULL
              THEN CASE WHEN ${updates.status} = 'published'
                THEN COALESCE(${updates.publishedAt ? new Date(updates.publishedAt).toISOString() : null}, published_at, NOW())
                ELSE NULL END
            WHEN ${updates.publishedAt ? new Date(updates.publishedAt).toISOString() : null} IS NOT NULL
              THEN ${new Date(updates.publishedAt).toISOString()}
            ELSE published_at END,
          tags = COALESCE(${updates.tags ? JSON.stringify(updates.tags) : null}::jsonb, tags),
          featured_image = COALESCE(${updates.featuredImage ?? null}, featured_image),
          video_embeds = COALESCE(${updates.videoEmbeds ? JSON.stringify(updates.videoEmbeds) : null}::jsonb, video_embeds),
          seo_title = COALESCE(${updates.seoTitle ?? null}, seo_title),
          seo_description = COALESCE(${updates.seoDescription ?? null}, seo_description),
          updated_at = ${now}
        WHERE id = ${id}`;
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      await sql`DELETE FROM blog_posts WHERE id = ${body.id}`;
      return NextResponse.json({ success: true });
    }

    if (action === 'setStatus') {
      const { id, status } = body;
      if (status === 'published') {
        await sql`
          UPDATE blog_posts SET status = 'published',
            published_at = COALESCE(published_at, NOW()), updated_at = ${now}
          WHERE id = ${id}`;
      } else {
        await sql`
          UPDATE blog_posts SET status = ${status}, published_at = NULL, updated_at = ${now}
          WHERE id = ${id}`;
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'bulkStatus') {
      const { ids, status } = body;
      for (const id of ids as string[]) {
        if (status === 'published') {
          await sql`
            UPDATE blog_posts SET status = 'published',
              published_at = COALESCE(published_at, NOW()), updated_at = ${now}
            WHERE id = ${id}`;
        } else {
          await sql`
            UPDATE blog_posts SET status = ${status}, published_at = NULL, updated_at = ${now}
            WHERE id = ${id}`;
        }
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Blog POST error:', message);
    return NextResponse.json({ error: 'Blog request failed', details: message }, { status: 500 });
  }
}
