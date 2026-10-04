'use client';

import { useState, useRef, useCallback } from 'react';
import { getAuthToken } from '@/lib/client-auth';
import { getApiUrl } from '@/lib/api-config';
import { Upload, FileUp, X, CheckCircle, AlertCircle, Lock, Globe } from 'lucide-react';

const MAX_FILE_SIZE_MB = 50;
const ALLOWED_EXT = ['.pdf', '.docx', '.epub', '.mobi'];
const ALLOWED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/epub+zip',
  'application/x-mobipocket-ebook',
];

interface Props {
  onUploadComplete?: (bookId: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function validateFile(f: File): string | null {
  const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'));
  const ok = ALLOWED_MIME.includes(f.type) || ALLOWED_EXT.includes(ext);
  if (!ok) return 'Please select a PDF, DOCX, EPUB, or MOBI file';
  if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `Maximum file size is ${MAX_FILE_SIZE_MB}MB`;
  return null;
}

export default function BookUpload({ onUploadComplete }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [accessLevel, setAccessLevel] = useState<'public' | 'restricted'>('public');
  const [allowedUserEmails, setAllowedUserEmails] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [price, setPrice] = useState('0');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setTitle('');
    setAuthor('');
    setDescription('');
    setAccessLevel('public');
    setAllowedUserEmails('');
    setPageCount('');
    setPrice('0');
    setProgress(0);
    setError('');
    setSuccess('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const onPick = () => inputRef.current?.click();

  const acceptFile = (f: File | null) => {
    if (!f) return;
    const err = validateFile(f);
    if (err) { setError(err); setFile(null); }
    else { setFile(f); setError(''); if (!title) setTitle(f.name.replace(/\.(pdf|docx|epub|mobi)$/i, '')); }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    acceptFile(e.target.files?.[0] ?? null);
  };

  const removeFile = () => { setFile(null); setProgress(0); if (inputRef.current) inputRef.current.value = ''; };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    acceptFile(e.dataTransfer.files?.[0] ?? null);
  }, [title]);

  const doUpload = async () => {
    if (!file || !title.trim()) { setError('Select a file and enter a title'); return; }

    setUploading(true);
    setError('');
    setSuccess('');
    setProgress(0);

    try {
      const token = await getAuthToken();

      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', title.trim());
      fd.append('author', author.trim());
      fd.append('description', description.trim());
      fd.append('accessLevel', accessLevel);
      fd.append('allowedUserEmails', allowedUserEmails);
      fd.append('pageCount', pageCount);
      fd.append('price', price);

      // Server-side upload to R2 + Postgres
      // Simulate progress since we no longer have XHR upload events
      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 5 : prev));
      }, 300);

      const res = await fetch(getApiUrl('/api/books/upload/'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const text = await res.text();
        let msg = text;
        try {
          const e = JSON.parse(text);
          msg = e.details || (typeof e.error === 'string' ? e.error : JSON.stringify(e.error || e));
        } catch { /* use raw text */ }
        throw new Error(msg || 'Upload failed');
      }
      const data = await res.json();

      setProgress(100);
      setSuccess(`"${title.trim()}" uploaded successfully!`);
      onUploadComplete?.(data.bookId);
      setTimeout(reset, 2500);
    } catch (err) {
      console.error(err);
      setError('Failed to upload: ' + (err as Error).message);
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
          <Upload size={20} className="text-brand-600" />
          <h2 className="text-xl font-bold text-gray-900">Upload Book</h2>
        </div>

        <div className="p-6 space-y-5">
          {/* Hidden native input */}
          <input ref={inputRef} type="file" className="hidden" onChange={onFileChange} />

          {/* Custom file selector / drop zone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Book File <span className="text-red-500">*</span>
            </label>
            {!file ? (
              <div
                onClick={onPick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed rounded-xl text-sm font-medium cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-300 text-gray-600 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700'
                }`}
              >
                <FileUp size={20} className={isDragOver ? 'text-brand-600' : 'text-gray-400'} />
                {isDragOver ? 'Drop file here' : 'Click or drag & drop a file'}
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 border border-green-200 bg-green-50 rounded-xl">
                <CheckCircle size={18} className="text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  disabled={uploading}
                  className="shrink-0 p-1 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                  title="Remove"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <p className="mt-1.5 text-xs text-gray-400">Max {MAX_FILE_SIZE_MB}MB · PDF, DOCX, EPUB, MOBI</p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
              placeholder="Enter book title"
            />
          </div>

          {/* Author + Access */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Author</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                placeholder="Author name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Access</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAccessLevel('public')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    accessLevel === 'public' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Globe size={14} /> Public
                </button>
                <button
                  type="button"
                  onClick={() => setAccessLevel('restricted')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    accessLevel === 'restricted' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Lock size={14} /> Restricted
                </button>
              </div>
            </div>
          </div>

          {/* Page Count + Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Page Count <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                min={1}
                value={pageCount}
                onChange={(e) => setPageCount(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                placeholder="e.g. 120"
              />
              <p className="mt-1 text-xs text-gray-500">
                Required for page-by-page reader. Leave blank for iframe viewer.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Price (USD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                placeholder="0.00"
              />
              <p className="mt-1 text-xs text-gray-500">
                Set to 0 for free books.
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm resize-none"
              placeholder="Short description..."
            />
          </div>

          {/* Restricted emails */}
          {accessLevel === 'restricted' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Approved Reader Emails</label>
              <textarea
                value={allowedUserEmails}
                onChange={(e) => setAllowedUserEmails(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm resize-none"
                placeholder="reader1@example.com, reader2@example.com"
              />
              <p className="mt-1 text-xs text-gray-500">Separate emails with commas or new lines.</p>
            </div>
          )}

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-medium">{progress < 100 ? 'Uploading...' : 'Processing...'}</span>
                <span className="text-gray-900 font-semibold">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div className="bg-brand-600 h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Alerts */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2.5 p-3.5 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle size={18} className="text-green-600 mt-0.5 shrink-0" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={doUpload}
              disabled={!file || !title.trim() || uploading}
              className="flex-1 px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={16} />
              {uploading ? 'Uploading...' : 'Upload Book'}
            </button>
            {(file || title || author || description || allowedUserEmails || pageCount || price !== '0') && !uploading && (
              <button
                onClick={reset}
                className="px-5 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
