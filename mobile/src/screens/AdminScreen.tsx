import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { colors, radius, spacing } from '../theme';
import { RpvCard, Loading, Empty, FieldLabel, textStyles } from '../components/Rpv';
import { useAuthStore } from '../store/authStore';
import { useAdminStore } from '../store/adminStore';
import { getTranslations, RpvTranslation } from '../services/bible';
import {
  updateVerse,
  setBookPublished,
  setBookIntroduction,
  getHighlights,
  addHighlight,
  deleteHighlight,
  AdminHighlight,
  getBlogPosts,
  createBlogPost,
  setBlogPostStatus,
  deleteBlogPost,
  AdminBlogPost,
  uploadTranslationDocument,
} from '../services/adminApi';

type AdminTab = 'edit' | 'publications' | 'highlights' | 'blog' | 'banner';

const TABS: { id: AdminTab; label: string; description: string }[] = [
  { id: 'edit', label: 'Upload & Edit', description: 'Import translations or make quick edits' },
  { id: 'publications', label: 'Manage Publications', description: 'Control published books and metadata' },
  { id: 'highlights', label: 'Featured Highlights', description: 'Curate the featured homepage content' },
  { id: 'blog', label: 'Blog Management', description: 'Publish and schedule blog articles' },
  { id: 'banner', label: 'Banner Settings', description: 'Update the homepage announcement banner' },
];

// ---------- Upload & Edit tab ----------

const UPLOAD_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
  json: 'application/json',
};

function UploadCard({ onDone }: { onDone: () => void }): React.ReactElement {
  const [translationId, setTranslationId] = useState('RPV');
  const [translationName, setTranslationName] = useState('Redemption Project Version');
  const [bookName, setBookName] = useState('');
  const [file, setFile] = useState<{ uri: string; name: string; size?: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/json'],
      copyToCacheDirectory: true,
    });
    if (!res.canceled && res.assets?.[0]) {
      setFile({ uri: res.assets[0].uri, name: res.assets[0].name, size: res.assets[0].size });
      if (!bookName) setBookName(res.assets[0].name.replace(/\.(pdf|docx|txt|json)$/i, ''));
    }
  };

  const upload = async () => {
    if (!file || !translationId.trim() || !bookName.trim()) {
      Alert.alert('Missing fields', 'Choose a file and enter a translation ID and book name.');
      return;
    }
    const ext = file.name.toLowerCase().split('.').pop() || '';
    const mimeType = UPLOAD_MIME[ext] || 'application/octet-stream';
    setBusy(true);
    try {
      const result = await uploadTranslationDocument({
        uri: file.uri,
        fileName: file.name,
        mimeType,
        translationId: translationId.trim(),
        translationName: translationName.trim() || translationId.trim(),
        bookName: bookName.trim(),
      });
      Alert.alert(
        'Upload complete',
        `Imported ${result.booksImported.join(', ')} into ${result.translationId} — ${result.chaptersCount} chapter(s), ${result.versesCount} verse(s).\n\nThe translation is live for all readers.`,
      );
      setFile(null);
      setBookName('');
      onDone();
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <RpvCard>
      <Text style={styles.sectionTitle}>Upload Document Translation</Text>
      <Text style={textStyles.body}>
        Upload a PDF, DOCX, TXT or JSON file containing one book of Bible text. Chapters and
        verses are detected automatically and merged into the translation — everyone sees it
        immediately.
      </Text>

      <FieldLabel>Translation ID</FieldLabel>
      <TextInput style={styles.input} value={translationId} onChangeText={setTranslationId} placeholder="e.g. RPV or pidgin-bible" />

      <FieldLabel>Translation Name</FieldLabel>
      <TextInput style={styles.input} value={translationName} onChangeText={setTranslationName} placeholder="e.g. Redemption Project Version" />

      <FieldLabel>Book Name</FieldLabel>
      <TextInput style={styles.input} value={bookName} onChangeText={setBookName} placeholder="e.g. John" />

      <FieldLabel>Document</FieldLabel>
      {file ? (
        <View style={styles.fileRow}>
          <MaterialCommunityIcons name="file-check-outline" size={20} color="#1a7f37" />
          <View style={styles.itemBody}>
            <Text style={styles.itemTitle} numberOfLines={1}>{file.name}</Text>
            {file.size != null && (
              <Text style={styles.bookMeta}>{(file.size / 1024 / 1024).toFixed(2)} MB</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => setFile(null)} disabled={busy}>
            <MaterialCommunityIcons name="close-circle-outline" size={20} color={colors.red600} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.dropzone} onPress={pick} disabled={busy}>
          <MaterialCommunityIcons name="file-upload-outline" size={22} color={colors.inkSoft} />
          <Text style={styles.dropzoneText}>Choose PDF, DOCX, TXT or JSON</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.primaryBtn, (!file || !bookName.trim() || busy) && styles.btnDisabled]}
        onPress={upload}
        disabled={!file || !bookName.trim() || busy}
      >
        <Text style={styles.primaryBtnText}>{busy ? 'Uploading & Parsing…' : 'Upload & Parse Document'}</Text>
      </TouchableOpacity>

      <Text style={styles.uploadHint}>
        Tips: mark chapters clearly (e.g. "Chapter 1"), start each verse with its number, and use one book per file.
      </Text>
    </RpvCard>
  );
}

function EditTab({ translations, onRefresh }: { translations: RpvTranslation[]; onRefresh: () => void }): React.ReactElement {
  const [translationId, setTranslationId] = useState(translations[0]?.id || 'RPV');
  const [book, setBook] = useState('Romans');
  const [chapter, setChapter] = useState('1');
  const [verse, setVerse] = useState('1');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const selected = translations.find((t) => t.id === translationId);

  const save = async () => {
    const ch = parseInt(chapter, 10);
    const vs = parseInt(verse, 10);
    if (!book.trim() || !ch || !vs || !text.trim()) {
      Alert.alert('Missing fields', 'Enter a book, chapter, verse, and text.');
      return;
    }
    setSaving(true);
    try {
      await updateVerse({
        translationId,
        translationName: selected?.name,
        book: book.trim(),
        chapter: ch,
        verse: vs,
        text: text.trim(),
      });
      Alert.alert('Saved', `${book.trim()} ${ch}:${vs} saved successfully.`);
      setText('');
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.tabBody}>
      <UploadCard onDone={onRefresh} />
      <RpvCard>
        <Text style={styles.sectionTitle}>Quick Edit Verse</Text>
        <Text style={textStyles.body}>
          Update a single verse. The change merges into the stored translation —
          all other books and verses are preserved.
        </Text>

        <FieldLabel>Translation</FieldLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {translations.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setTranslationId(t.id)}
              style={[styles.chip, t.id === translationId && styles.chipActive]}
            >
              <Text style={[styles.chipText, t.id === translationId && styles.chipTextActive]}>
                {t.id}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FieldLabel>Book</FieldLabel>
        <TextInput style={styles.input} value={book} onChangeText={setBook} placeholder="e.g. Romans" />

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <FieldLabel>Chapter</FieldLabel>
            <TextInput
              style={styles.input}
              value={chapter}
              onChangeText={setChapter}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.col}>
            <FieldLabel>Verse</FieldLabel>
            <TextInput
              style={styles.input}
              value={verse}
              onChangeText={setVerse}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <FieldLabel>Text</FieldLabel>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={text}
          onChangeText={setText}
          placeholder="Verse text…"
          multiline
        />

        <TouchableOpacity
          style={[styles.primaryBtn, saving && styles.btnDisabled]}
          onPress={save}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.primaryBtnText}>Save Verse</Text>
          )}
        </TouchableOpacity>
      </RpvCard>

      <RpvCard>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="file-upload-outline" size={22} color={colors.navy800} />
          <View style={styles.itemBody}>
            <Text style={styles.itemTitle}>Document Upload</Text>
            <Text style={textStyles.body}>
              PDF/DOCX parsing runs on the web admin (rpvbible.com/admin). Verse
              edits made here merge safely — single-book uploads no longer wipe
              other books.
            </Text>
          </View>
        </View>
      </RpvCard>
    </View>
  );
}

// ---------- Manage Publications tab ----------

function PublicationsTab({
  translations,
  onRefresh,
}: {
  translations: RpvTranslation[];
  onRefresh: () => void;
}): React.ReactElement {
  const [translationId, setTranslationId] = useState(translations[0]?.id || 'RPV');
  const [busy, setBusy] = useState<string | null>(null);
  const [introBook, setIntroBook] = useState<string | null>(null);
  const [introText, setIntroText] = useState('');
  const [savingIntro, setSavingIntro] = useState(false);

  const translation = translations.find((t) => t.id === translationId) || translations[0];
  const books = translation?.books || [];
  const publishedCount = books.filter((b) => b.published !== false).length;

  const toggle = async (bookName: string, published: boolean) => {
    setBusy(bookName);
    try {
      await setBookPublished(translation.id, bookName, !published);
      onRefresh();
    } catch (e) {
      Alert.alert('Update failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(null);
    }
  };

  const saveIntro = async (bookName: string) => {
    setSavingIntro(true);
    try {
      await setBookIntroduction(translation.id, bookName, introText.trim());
      setIntroBook(null);
      onRefresh();
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSavingIntro(false);
    }
  };

  if (!translation) {
    return <Empty icon="book-off-outline" message="No translations loaded." />;
  }

  return (
    <View style={styles.tabBody}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {translations.map((t) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => {
              setTranslationId(t.id);
              setIntroBook(null);
            }}
            style={[styles.chip, t.id === translation.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, t.id === translation.id && styles.chipTextActive]}>
              {t.id}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{books.length}</Text>
          <Text style={styles.statLabel}>Books</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: '#1a7f37' }]}>{publishedCount}</Text>
          <Text style={styles.statLabel}>Published</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: colors.red600 }]}>
            {books.length - publishedCount}
          </Text>
          <Text style={styles.statLabel}>Unpublished</Text>
        </View>
      </View>

      {books.map((b) => {
        const published = b.published !== false;
        const isBusy = busy === b.name;
        return (
          <RpvCard key={b.name}>
            <View style={styles.bookRow}>
              <View style={styles.itemBody}>
                <Text style={styles.itemTitle}>{b.name}</Text>
                <Text style={styles.bookMeta}>
                  {b.chapterCount} chapter{b.chapterCount === 1 ? '' : 's'}
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: published ? '#e6f4ea' : colors.red50 },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: published ? '#1a7f37' : colors.red600 },
                  ]}
                >
                  {published ? 'Published' : 'Unpublished'}
                </Text>
              </View>
            </View>
            <View style={styles.bookActions}>
              <TouchableOpacity
                style={[styles.smallBtn, published ? styles.unpublishBtn : styles.publishBtn]}
                onPress={() => toggle(b.name, published)}
                disabled={isBusy}
              >
                {isBusy ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.smallBtnText}>
                    {published ? 'Unpublish' : 'Publish'}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.smallBtnOutline}
                onPress={() => {
                  setIntroBook(introBook === b.name ? null : b.name);
                  setIntroText(b.introduction || '');
                }}
              >
                <Text style={styles.smallBtnOutlineText}>Introduction</Text>
              </TouchableOpacity>
            </View>

            {introBook === b.name && (
              <View style={styles.introEditor}>
                <FieldLabel>Book introduction</FieldLabel>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={introText}
                  onChangeText={setIntroText}
                  multiline
                  placeholder="Optional introduction shown before the book…"
                />
                <TouchableOpacity
                  style={[styles.primaryBtn, savingIntro && styles.btnDisabled]}
                  onPress={() => saveIntro(b.name)}
                  disabled={savingIntro}
                >
                  {savingIntro ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Save Introduction</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </RpvCard>
        );
      })}
    </View>
  );
}

// ---------- Featured Highlights tab ----------

function HighlightsTab({ translations }: { translations: RpvTranslation[] }): React.ReactElement {
  const [highlights, setHighlights] = useState<AdminHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [translationId, setTranslationId] = useState(translations[0]?.id || 'RPV');
  const [book, setBook] = useState('');
  const [chapter, setChapter] = useState('');
  const [verse, setVerse] = useState('');
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setHighlights(await getHighlights());
    } catch {
      setHighlights([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    const ch = parseInt(chapter, 10);
    const vs = parseInt(verse, 10);
    if (!book.trim() || !ch || !vs || !text.trim()) {
      Alert.alert('Missing fields', 'Book, chapter, verse, and text are required.');
      return;
    }
    setSaving(true);
    try {
      await addHighlight({
        translationId,
        book: book.trim(),
        chapter: ch,
        verse: vs,
        text: text.trim(),
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        order: highlights.length,
      });
      setShowForm(false);
      setBook('');
      setChapter('');
      setVerse('');
      setText('');
      setTitle('');
      setDescription('');
      await load();
    } catch (e) {
      Alert.alert('Add failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const remove = (h: AdminHighlight) => {
    Alert.alert('Remove highlight', `${h.book} ${h.chapter}:${h.verse}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteHighlight(h.id);
            await load();
          } catch (e) {
            Alert.alert('Delete failed', e instanceof Error ? e.message : 'Unknown error');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.tabBody}>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowForm(!showForm)}>
        <Text style={styles.primaryBtnText}>
          {showForm ? 'Cancel' : '+ Add Highlight'}
        </Text>
      </TouchableOpacity>

      {showForm && (
        <RpvCard>
          <Text style={styles.sectionTitle}>New Highlight</Text>
          <FieldLabel>Translation</FieldLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {translations.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => setTranslationId(t.id)}
                style={[styles.chip, t.id === translationId && styles.chipActive]}
              >
                <Text style={[styles.chipText, t.id === translationId && styles.chipTextActive]}>
                  {t.id}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <FieldLabel>Book</FieldLabel>
          <TextInput style={styles.input} value={book} onChangeText={setBook} placeholder="e.g. Romans" />
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <FieldLabel>Chapter</FieldLabel>
              <TextInput style={styles.input} value={chapter} onChangeText={setChapter} keyboardType="number-pad" />
            </View>
            <View style={styles.col}>
              <FieldLabel>Verse</FieldLabel>
              <TextInput style={styles.input} value={verse} onChangeText={setVerse} keyboardType="number-pad" />
            </View>
          </View>
          <FieldLabel>Text</FieldLabel>
          <TextInput style={[styles.input, styles.textArea]} value={text} onChangeText={setText} multiline placeholder="Verse text…" />
          <FieldLabel>Title (optional)</FieldLabel>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} />
          <FieldLabel>Description (optional)</FieldLabel>
          <TextInput style={styles.input} value={description} onChangeText={setDescription} />
          <TouchableOpacity style={[styles.primaryBtn, saving && styles.btnDisabled]} onPress={add} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.primaryBtnText}>Add Highlight</Text>}
          </TouchableOpacity>
        </RpvCard>
      )}

      {loading ? (
        <Loading label="Loading highlights…" />
      ) : highlights.length === 0 ? (
        <Empty icon="star-outline" message="No featured highlights yet." />
      ) : (
        highlights.map((h) => (
          <RpvCard key={h.id}>
            <View style={styles.bookRow}>
              <View style={styles.itemBody}>
                {!!h.title && <Text style={styles.itemTitle}>{h.title}</Text>}
                <Text style={styles.bookMeta}>
                  {h.translationId} · {h.book} {h.chapter}:{h.verse}
                </Text>
                <Text style={textStyles.body} numberOfLines={3}>
                  {h.text}
                </Text>
              </View>
              <TouchableOpacity onPress={() => remove(h)} style={styles.deleteBtn}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.red600} />
              </TouchableOpacity>
            </View>
          </RpvCard>
        ))
      )}
    </View>
  );
}

// ---------- Blog tab ----------

const BLOG_STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  published: { bg: '#e8f5e9', fg: '#1a7f37' },
  draft: { bg: colors.red50, fg: colors.red700 },
  archived: { bg: '#ececf1', fg: colors.inkSoft },
};

function BlogTab(): React.ReactElement {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [publishNow, setPublishNow] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      setPosts(await getBlogPosts());
    } catch (e) {
      Alert.alert('Load failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Missing fields', 'Enter a title and content.');
      return;
    }
    setBusy(true);
    try {
      await createBlogPost({
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim(),
        authorName: user?.displayName || user?.email || 'Admin',
        status: publishNow ? 'published' : 'draft',
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      Alert.alert('Created', publishNow ? 'Post published.' : 'Draft saved.');
      setTitle(''); setExcerpt(''); setContent(''); setTags(''); setPublishNow(false); setShowForm(false);
      await load();
    } catch (e) {
      Alert.alert('Create failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (id: string, status: 'draft' | 'published' | 'archived') => {
    setBusy(true);
    try {
      await setBlogPostStatus(id, status);
      await load();
    } catch (e) {
      Alert.alert('Update failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const remove = (id: string, postTitle: string) => {
    Alert.alert('Delete post', `Delete "${postTitle}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await deleteBlogPost(id);
            await load();
          } catch (e) {
            Alert.alert('Delete failed', e instanceof Error ? e.message : 'Unknown error');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const published = posts.filter((p) => p.status === 'published').length;
  const drafts = posts.filter((p) => p.status === 'draft').length;

  return (
    <View style={styles.tabBody}>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{posts.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{published}</Text>
          <Text style={styles.statLabel}>Published</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{drafts}</Text>
          <Text style={styles.statLabel}>Drafts</Text>
        </View>
      </View>

      <RpvCard>
        <View style={styles.bookRow}>
          <View style={styles.itemBody}>
            <Text style={styles.sectionTitle}>New Post</Text>
            <Text style={textStyles.body}>Create an article for the blog and news pages.</Text>
          </View>
          <TouchableOpacity
            style={[styles.smallBtn, publishNow ? styles.unpublishBtn : styles.publishBtn]}
            onPress={() => setShowForm((v) => !v)}
          >
            <Text style={styles.smallBtnText}>{showForm ? 'Close' : 'Write'}</Text>
          </TouchableOpacity>
        </View>

        {showForm && (
          <View style={styles.introEditor}>
            <FieldLabel>Title</FieldLabel>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Post title" />
            <FieldLabel>Excerpt</FieldLabel>
            <TextInput style={styles.input} value={excerpt} onChangeText={setExcerpt} placeholder="Short summary (optional)" />
            <FieldLabel>Content</FieldLabel>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder="Write the article…"
              multiline
            />
            <FieldLabel>Tags (comma separated)</FieldLabel>
            <TextInput style={styles.input} value={tags} onChangeText={setTags} placeholder="news, update" />
            <TouchableOpacity style={styles.bookRow} onPress={() => setPublishNow((v) => !v)}>
              <MaterialCommunityIcons
                name={publishNow ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={20}
                color={colors.red600}
              />
              <Text style={textStyles.body}>Publish immediately</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, busy && styles.btnDisabled]}
              onPress={submit}
              disabled={busy}
            >
              <Text style={styles.primaryBtnText}>{busy ? 'Working…' : 'Create Post'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </RpvCard>

      {busy && posts.length === 0 ? (
        <Loading label="Loading posts…" />
      ) : posts.length === 0 ? (
        <Empty icon="file-document-outline" message="No blog posts yet." />
      ) : (
        posts.map((post) => {
          const badge = BLOG_STATUS_COLORS[post.status] || BLOG_STATUS_COLORS.draft;
          return (
            <RpvCard key={post.id}>
              <View style={styles.bookRow}>
                <View style={styles.itemBody}>
                  <Text style={styles.itemTitle}>{post.title}</Text>
                  <Text style={styles.bookMeta}>
                    {post.authorName} • {new Date(post.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.fg }]}>{post.status}</Text>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => remove(post.id, post.title)}>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.red600} />
                </TouchableOpacity>
              </View>
              {post.excerpt ? (
                <Text style={[textStyles.body, { marginTop: 6 }]} numberOfLines={2}>
                  {post.excerpt}
                </Text>
              ) : null}
              <View style={styles.bookActions}>
                {post.status !== 'published' && (
                  <TouchableOpacity
                    style={[styles.smallBtn, styles.publishBtn]}
                    onPress={() => changeStatus(post.id, 'published')}
                  >
                    <Text style={styles.smallBtnText}>Publish</Text>
                  </TouchableOpacity>
                )}
                {post.status === 'published' && (
                  <TouchableOpacity
                    style={[styles.smallBtn, styles.unpublishBtn]}
                    onPress={() => changeStatus(post.id, 'draft')}
                  >
                    <Text style={styles.smallBtnText}>Unpublish</Text>
                  </TouchableOpacity>
                )}
                {post.status !== 'archived' && (
                  <TouchableOpacity
                    style={styles.smallBtnOutline}
                    onPress={() => changeStatus(post.id, 'archived')}
                  >
                    <Text style={styles.smallBtnOutlineText}>Archive</Text>
                  </TouchableOpacity>
                )}
              </View>
            </RpvCard>
          );
        })
      )}
    </View>
  );
}

// ---------- Info-only tabs ----------

function InfoTab({
  icon,
  title,
  body,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  body: string;
}): React.ReactElement {
  return (
    <View style={styles.tabBody}>
      <RpvCard>
        <View style={styles.infoRow}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name={icon} size={22} color={colors.red600} />
          </View>
          <View style={styles.itemBody}>
            <Text style={styles.itemTitle}>{title}</Text>
            <Text style={textStyles.body}>{body}</Text>
          </View>
        </View>
      </RpvCard>
    </View>
  );
}

// ---------- Screen ----------

export default function AdminScreen(): React.ReactElement {
  const { user } = useAuthStore();
  const { isAdmin, adminUser, loading, getAdminUser } = useAdminStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('edit');
  const [translations, setTranslations] = useState<RpvTranslation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) getAdminUser(user.uid);
  }, [user]);

  const loadManifest = useCallback(async (force = false) => {
    setRefreshing(true);
    try {
      setTranslations(await getTranslations(force));
    } catch {
      // keep last-known list
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadManifest();
  }, [isAdmin, loadManifest]);

  const activeDescription = useMemo(
    () => TABS.find((t) => t.id === activeTab)?.description || '',
    [activeTab]
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <Empty icon="lock-outline" message="Sign in to access admin features." />
      </View>
    );
  }
  if (loading) return <Loading label="Checking access…" />;
  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Empty icon="shield-alert-outline" message="You don't have admin access." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.shieldRow}>
          <MaterialCommunityIcons name="shield-crown" size={26} color={colors.red600} />
          <Text style={textStyles.heroTitle}>Admin Dashboard</Text>
        </View>
        <Text style={styles.heroSub}>{adminUser?.email || user.email}</Text>
      </View>

      {/* Tab bar — mirrors the web admin's section nav */}
      <View style={styles.tabBarWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          {TABS.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.tabPill, active && styles.tabPillActive]}
              >
                <Text style={[styles.tabPillText, active && styles.tabPillTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <Text style={styles.tabDesc}>{activeDescription}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadManifest(true)}
            tintColor={colors.red600}
          />
        }
      >
        {activeTab === 'edit' && (
          <EditTab translations={translations} onRefresh={() => loadManifest(true)} />
        )}
        {activeTab === 'publications' && (
          <PublicationsTab
            translations={translations}
            onRefresh={() => loadManifest(true)}
          />
        )}
        {activeTab === 'highlights' && <HighlightsTab translations={translations} />}
        {activeTab === 'blog' && <BlogTab />}
        {activeTab === 'banner' && (
          <InfoTab
            icon="bullhorn-outline"
            title="Banner Settings"
            body="The homepage announcement banner is configured on the web admin at rpvbible.com/admin."
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  hero: {
    backgroundColor: colors.navy900,
    padding: spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  shieldRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroSub: { color: colors.lavSoft, fontSize: 13, marginTop: 6 },
  scroll: { flex: 1 },

  tabBarWrap: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: 10,
  },
  tabBar: { paddingHorizontal: spacing.md, gap: 8, paddingBottom: 10 },
  tabPill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  tabPillActive: {
    backgroundColor: colors.red600,
    borderColor: colors.red600,
  },
  tabPillText: { fontSize: 13, fontWeight: '600', color: colors.inkSoft },
  tabPillTextActive: { color: colors.white },
  tabDesc: {
    fontSize: 12,
    color: colors.inkFaint,
    paddingHorizontal: spacing.md,
    paddingBottom: 8,
  },

  tabBody: { padding: spacing.md, gap: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },

  chipRow: { flexDirection: 'row', marginBottom: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: colors.white,
  },
  chipActive: { borderColor: colors.red600, backgroundColor: colors.red50 },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.inkSoft },
  chipTextActive: { color: colors.red600 },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  textArea: { minHeight: 96, textAlignVertical: 'top' },
  twoCol: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },

  primaryBtn: {
    backgroundColor: colors.red600,
    borderRadius: radius.input,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },

  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statNum: { fontSize: 20, fontWeight: '800', color: colors.navy800 },
  statLabel: { fontSize: 11, color: colors.inkFaint, marginTop: 2 },

  bookRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemBody: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 2 },
  bookMeta: { fontSize: 12, color: colors.inkFaint },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  bookActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  smallBtn: {
    borderRadius: radius.input,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 92,
    alignItems: 'center',
  },
  publishBtn: { backgroundColor: '#1a7f37' },
  unpublishBtn: { backgroundColor: colors.red600 },
  smallBtnText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  smallBtnOutline: {
    borderRadius: radius.input,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallBtnOutlineText: { color: colors.inkSoft, fontSize: 13, fontWeight: '600' },
  introEditor: { marginTop: 12 },
  deleteBtn: { padding: 6 },

  dropzone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingVertical: 26,
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  dropzoneText: { fontSize: 13, fontWeight: '600', color: colors.inkSoft },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
    borderRadius: radius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: spacing.sm,
  },
  uploadHint: { fontSize: 11, color: colors.inkFaint, marginTop: 8, lineHeight: 16 },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.input,
    backgroundColor: colors.red50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
