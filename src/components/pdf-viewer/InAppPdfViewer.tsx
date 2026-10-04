'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getAuthToken } from '@/lib/client-auth';
import { getApiUrl } from '@/lib/api-config';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Loader2,
  AlertCircle,
  RotateCcw,
  Minus,
  Plus,
  Home,
} from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

interface InAppPdfViewerProps {
  bookId: string;
  title: string;
}

export default function InAppPdfViewer({ bookId, title }: InAppPdfViewerProps) {
  const [pdf, setPdf] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pageRendering, setPageRendering] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingPage = useRef<number | null>(null);

  // Load PDF
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const token = await getAuthToken();
        if (!token) throw new Error('You must be signed in');

        const res = await fetch(getApiUrl(`/api/books/${bookId}/stream/`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to load book');
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const doc = await pdfjs.getDocument(url).promise;
        if (cancelled) return;
        setPdf(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load PDF');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [bookId]);

  // Render page
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdf || !canvasRef.current) return;
      if (pageRendering) {
        pendingPage.current = pageNum;
        return;
      }
      setPageRendering(true);
      try {
        const page = await pdf.getPage(pageNum);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const viewport = page.getViewport({ scale: zoom });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      } catch (e) {
        console.error('Render error:', e);
      } finally {
        setPageRendering(false);
        if (pendingPage.current !== null) {
          const next = pendingPage.current;
          pendingPage.current = null;
          renderPage(next);
        }
      }
    },
    [pdf, zoom]
  );

  useEffect(() => {
    if (pdf) renderPage(currentPage);
  }, [pdf, currentPage, renderPage]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        goToPage(currentPage + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goToPage(currentPage - 1);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleZoomFit();
      } else if ((e.ctrlKey || e.metaKey) && ['c', 'C', 's', 'S', 'p', 'P', 'a', 'A'].includes(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentPage, numPages]);

  // Scoped copy protection
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const stop = (e: Event) => { e.preventDefault(); return false; };
    el.addEventListener('contextmenu', stop);
    el.addEventListener('selectstart', stop);
    return () => {
      el.removeEventListener('contextmenu', stop);
      el.removeEventListener('selectstart', stop);
    };
  }, []);

  const goToPage = useCallback((p: number) => {
    setCurrentPage(Math.max(1, Math.min(p, numPages || 1)));
  }, [numPages]);

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.25, 3)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.25, 0.5)), []);
  const handleZoomFit = useCallback(() => setZoom(1), []);

  const retry = () => {
    setError('');
    setLoading(true);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-brand-600" />
        <p className="ml-3 text-sm text-gray-500">Loading PDF…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-sm">
          <AlertCircle size={32} className="mx-auto text-red-500 mb-3" />
          <p className="text-sm text-red-700 font-medium mb-1">Failed to load PDF</p>
          <p className="text-xs text-red-600 mb-4">{error}</p>
          <button
            onClick={retry}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
          >
            <RotateCcw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 p-3 sm:p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1 || pageRendering}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white disabled:opacity-40 transition-colors shadow-sm"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="px-3 py-1.5 bg-white rounded-lg border border-gray-300 text-sm font-bold text-gray-900 whitespace-nowrap shadow-sm">
            Page {currentPage} of {numPages}
          </div>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages || pageRendering}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white disabled:opacity-40 transition-colors shadow-sm"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={handleZoomOut} disabled={zoom <= 0.5} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white disabled:opacity-40 shadow-sm">
            <Minus size={16} />
          </button>
          <span className="text-xs font-medium text-gray-600 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} disabled={zoom >= 3} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white disabled:opacity-40 shadow-sm">
            <Plus size={16} />
          </button>
          <button onClick={handleZoomFit} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white shadow-sm" title="Reset zoom">
            <Home size={16} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative bg-gray-100 rounded-xl overflow-hidden border border-gray-200 min-h-[300px] sm:min-h-[500px] flex items-center justify-center">
        {pageRendering && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50 gap-3">
            <Loader2 size={32} className="animate-spin text-brand-600" />
            <p className="text-sm text-gray-500">Rendering page {currentPage}…</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="max-w-full shadow-lg"
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>Protected content — copying or downloading is prohibited</span>
        <span>Use arrow keys to navigate, +/- to zoom</span>
      </div>
    </div>
  );
}
