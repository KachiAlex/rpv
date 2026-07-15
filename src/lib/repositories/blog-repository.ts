import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  onSnapshot, 
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  getDocs,
  Timestamp, 
  writeBatch,
  DocumentSnapshot
} from 'firebase/firestore';
import { getFirebase } from '../firebase';
import type { BlogPost, BlogPostStatus } from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants/blog';

export class BlogRepository {
  private getDb() {
    const { db } = getFirebase();
    if (!db) {
      throw new Error('Firebase not initialized. Please check your Firebase configuration.');
    }
    return db;
  }

  // CRUD Operations
  async createPost(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogPost> {
    const db = this.getDb();
    const now = Timestamp.now();
    const docRef = doc(collection(db, FIRESTORE_COLLECTIONS.BLOG_POSTS));
    
    const blogPost: BlogPost = {
      ...post,
      id: docRef.id,
      createdAt: now.toDate(),
      updatedAt: now.toDate()
    };

    const firestoreData = {
      ...blogPost,
      createdAt: now,
      updatedAt: now,
      publishedAt: post.publishedAt ? Timestamp.fromDate(post.publishedAt) : null
    };

    await setDoc(docRef, firestoreData);
    return blogPost;
  }

  async updatePost(id: string, updates: Partial<BlogPost>): Promise<void> {
    const db = this.getDb();
    const docRef = doc(db, FIRESTORE_COLLECTIONS.BLOG_POSTS, id);
    
    const now = Timestamp.now();
    const firestoreUpdates: any = {
      ...updates,
      updatedAt: now
    };

    // Handle date fields
    if (updates.publishedAt) {
      firestoreUpdates.publishedAt = Timestamp.fromDate(updates.publishedAt);
    }

    await setDoc(docRef, firestoreUpdates, { merge: true });
  }

  async deletePost(id: string): Promise<void> {
    const db = this.getDb();
    const docRef = doc(db, FIRESTORE_COLLECTIONS.BLOG_POSTS, id);
    await deleteDoc(docRef);
  }

  async getPost(id: string): Promise<BlogPost | null> {
    const db = this.getDb();
    const docRef = doc(db, FIRESTORE_COLLECTIONS.BLOG_POSTS, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return this.convertFirestoreToPost(docSnap);
  }

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    const db = this.getDb();
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.BLOG_POSTS),
      where('slug', '==', slug),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    return this.convertFirestoreToPost(querySnapshot.docs[0]);
  }

  // Query Operations
  async getPublishedPosts(limitCount: number = 10, lastDoc?: DocumentSnapshot): Promise<{
    posts: BlogPost[];
    lastDoc?: DocumentSnapshot;
    hasMore: boolean;
  }> {
    const db = this.getDb();
    let q = query(
      collection(db, FIRESTORE_COLLECTIONS.BLOG_POSTS),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
      limit(limitCount + 1) // Get one extra to check if there are more
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs;
    const hasMore = docs.length > limitCount;
    
    // Remove the extra document if it exists
    const postsToReturn = hasMore ? docs.slice(0, limitCount) : docs;
    
    const posts = postsToReturn.map(doc => this.convertFirestoreToPost(doc));
    
    return {
      posts,
      lastDoc: postsToReturn[postsToReturn.length - 1],
      hasMore
    };
  }

  async getAllPosts(): Promise<BlogPost[]> {
    const db = this.getDb();
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.BLOG_POSTS),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => this.convertFirestoreToPost(doc));
  }

  async getPostsByStatus(status: BlogPostStatus): Promise<BlogPost[]> {
    const db = this.getDb();
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.BLOG_POSTS),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => this.convertFirestoreToPost(doc));
  }

  async getPostsByAuthor(authorId: string): Promise<BlogPost[]> {
    const db = this.getDb();
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.BLOG_POSTS),
      where('author', '==', authorId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => this.convertFirestoreToPost(doc));
  }

  async searchPosts(searchTerm: string, includeUnpublished: boolean = false): Promise<BlogPost[]> {
    const db = this.getDb();
    
    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation that searches by title
    // For production, consider using Algolia or similar service
    
    let q = query(
      collection(db, FIRESTORE_COLLECTIONS.BLOG_POSTS),
      orderBy('createdAt', 'desc')
    );

    if (!includeUnpublished) {
      q = query(q, where('status', '==', 'published'));
    }

    const querySnapshot = await getDocs(q);
    const allPosts = querySnapshot.docs.map(doc => this.convertFirestoreToPost(doc));
    
    // Client-side filtering for search term
    const searchTermLower = searchTerm.toLowerCase();
    return allPosts.filter(post => 
      post.title.toLowerCase().includes(searchTermLower) ||
      post.content.toLowerCase().includes(searchTermLower) ||
      post.excerpt.toLowerCase().includes(searchTermLower) ||
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTermLower)))
    );
  }

  // Publication Management
  async publishPost(id: string): Promise<void> {
    await this.updatePost(id, {
      status: 'published',
      publishedAt: new Date()
    });
  }

  async unpublishPost(id: string): Promise<void> {
    await this.updatePost(id, {
      status: 'draft',
      publishedAt: undefined
    });
  }

  async archivePost(id: string): Promise<void> {
    await this.updatePost(id, {
      status: 'archived'
    });
  }

  // Bulk Operations
  async bulkUpdateStatus(postIds: string[], status: BlogPostStatus): Promise<void> {
    const db = this.getDb();
    const batch = writeBatch(db);
    const now = Timestamp.now();

    for (const postId of postIds) {
      const docRef = doc(db, FIRESTORE_COLLECTIONS.BLOG_POSTS, postId);
      const updates: any = {
        status,
        updatedAt: now
      };

      if (status === 'published') {
        updates.publishedAt = now;
      } else if (status === 'draft' || status === 'archived') {
        updates.publishedAt = null;
      }

      batch.update(docRef, updates);
    }

    await batch.commit();
  }

  // Real-time Subscriptions
  subscribeToPost(id: string, callback: (post: BlogPost | null) => void): () => void {
    const db = this.getDb();
    const docRef = doc(db, FIRESTORE_COLLECTIONS.BLOG_POSTS, id);
    
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          callback(null);
          return;
        }
        callback(this.convertFirestoreToPost(docSnap));
      },
      (error) => {
        console.warn('Blog post subscription error:', error?.message || error);
        callback(null);
      }
    );
  }

  subscribeToPublishedPosts(callback: (posts: BlogPost[]) => void, limitCount: number = 10): () => void {
    const db = this.getDb();
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.BLOG_POSTS),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
      limit(limitCount)
    );
    
    return onSnapshot(
      q,
      (querySnapshot) => {
        const posts = querySnapshot.docs.map(doc => this.convertFirestoreToPost(doc));
        callback(posts);
      },
      (error) => {
        console.warn('Published posts subscription error:', error?.message || error);
        callback([]);
      }
    );
  }

  subscribeToAllPosts(callback: (posts: BlogPost[]) => void): () => void {
    const db = this.getDb();
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.BLOG_POSTS),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(
      q,
      (querySnapshot) => {
        const posts = querySnapshot.docs.map(doc => this.convertFirestoreToPost(doc));
        callback(posts);
      },
      (error) => {
        console.warn('All posts subscription error:', error?.message || error);
        callback([]);
      }
    );
  }

  // Helper Methods
  private convertFirestoreToPost(doc: DocumentSnapshot): BlogPost {
    const data = doc.data();
    if (!data) {
      throw new Error('Document data is undefined');
    }

    return {
      id: doc.id,
      title: data.title || '',
      content: data.content || '',
      excerpt: data.excerpt || '',
      slug: data.slug || '',
      author: data.author || '',
      authorName: data.authorName || '',
      status: data.status || 'draft',
      publishedAt: data.publishedAt?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      tags: data.tags || [],
      featuredImage: data.featuredImage,
      videoEmbeds: data.videoEmbeds || [],
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription
    } as BlogPost;
  }

  // Blog Metadata Operations
  async getBlogMetadata(): Promise<any> {
    const db = this.getDb();
    const docRef = doc(db, FIRESTORE_COLLECTIONS.BLOG_METADATA, 'settings');
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      // Return default metadata
      return {
        postsPerPage: 10,
        allowComments: false,
        moderationEnabled: true
      };
    }
    
    return docSnap.data();
  }

  async updateBlogMetadata(metadata: any): Promise<void> {
    const db = this.getDb();
    const docRef = doc(db, FIRESTORE_COLLECTIONS.BLOG_METADATA, 'settings');
    await setDoc(docRef, metadata, { merge: true });
  }
}