'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getAuthToken } from '@/lib/client-auth';
import { getApiUrl } from '@/lib/api-config';
import { setReadingProgress } from '@/lib/reading-progress';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertCircle,
  Lock,
  Loader2,
  RotateCcw,
  Minus,
  Plus,
  Home,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface R2PdfViewerProps {
  bookId: string;
  pageCount: number;
  initialPage?: number;
  onLoad?: (numPages: number) => void;
  onPageChange?: (pageNumber: number) => void;
}

export default function R2PdfViewer({
  bookId,
  pageCount,
  initialPage = 1,
  onLoad,
  onPageChange,
}: R2PdfViewerProps) {
  const [currentPage, setCurrentPage] = useState(Math.max(1, Math.min(initialPage, pageCount)));
  const [numPages, setNumPages] = useState(pageCount);
  const [loading, setLoading] = useState(true);
  const [pageRendering, setPageRendering] = useState(false);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const pendingPage = useRef<number | null>(null);

  useEffect(() => {
    if (pageCount > 0) {
      onLoad?.(pageCount);
    }
  }, [pageCount, onLoad]);

  // Load PDF from R2 presigned URL
  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      try {
        setLoading(true);
        setError('');

        const token = await getAuthToken();
        const response = await fetch(getApiUrl('/api/books/signed-url/'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ bookId }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || 'Failed to generate signed URL');
        }

        const data = await response.json();
        const presignedUrl = data.url as string;

        const loadingTask = pdfjsLib.getDocument(presignedUrl);
        const pdf = await loadingTask.promise;

        if (cancelled) return;

        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        onLoad?.(pdf.numPages);
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading PDF:', err);
          setError(err instanceof Error ? err.message : 'Failed to load PDF');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPdf();
    return () => { cancelled = true; };
  }, [bookId, onLoad]);

  // Render page
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDocRef.current || !canvasRef.current) return;
      if (pageRendering) {
        pendingPage.current = pageNum;
        return;
      }
      setPageRendering(true);
      try {
        const page = await pdfDocRef.current.getPage(pageNum);
        const canvas = canvasRef.current;
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
    [zoom]
  );

  useEffect(() => {
    if (pdfDocRef.current) renderPage(currentPage);
  }, [currentPage, renderPage]);

  const goToPage = useCallback((page: number) => {
    const clamped = Math.max(1, Math.min(page, numPages || pageCount));
    setCurrentPage(clamped);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    onPageChange?.(clamped);
    setReadingProgress(bookId, clamped);
  }, [numPages, pageCount, bookId, onPageChange]);

  const handleNextPage = useCallback(() => {
    if (currentPage < (numPages || pageCount)) goToPage(currentPage + 1);
  }, [currentPage, numPages, pageCount, goToPage]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.25, 3)), []);
  const handleZoomOut = useCallback(() => {
    setZoom((z) => {
      const next = Math.max(z - 0.25, 0.5);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);
  const handleZoomFit = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  // Keyboard navigation + protection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        handleNextPage();
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevPage();
        return;
      }
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
        return;
      }
      if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        handleZoomFit();
        return;
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        ['c', 'C', 's', 'S', 'p', 'P', 'a', 'A'].includes(e.key)
      ) {
        e.preventDefault();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextPage, handlePrevPage, handleZoomIn, handleZoomOut, handleZoomFit]);

  // Scoped protection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    container.addEventListener('contextmenu', handleContextMenu);
    container.addEventListener('selectstart', handleSelectStart);

    return () => {
      container.removeEventListener('contextmenu', handleContextMenu);
      container.removeEventListener('selectstart', handleSelectStart);
    };
  }, []);

  // Drag panning when zoomed
  const onMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const onMouseUp = () => setIsDragging(false);

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
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            <RotateCcw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="select-none"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 p-3 sm:p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || pageRendering}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-300 shadow-sm">
            <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
              Page {currentPage} of {numPages || pageCount}
            </span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= (numPages || pageCount) || pageRendering}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white disabled:opacity-40 transition-colors shadow-sm"
            aria-label="Zoom out"
          >
            <Minus size={16} />
          </button>
          <span className="text-xs font-medium text-gray-600 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white disabled:opacity-40 transition-colors shadow-sm"
            aria-label="Zoom in"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={handleZoomFit}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white transition-colors shadow-sm"
            aria-label="Fit to screen"
            title="Reset zoom (0)"
          >
            <Home size={16} />
          </button>
        </div>
      </div>

      {/* Page Canvas */}
      <div
        className="relative bg-gray-100 rounded-xl overflow-hidden border border-gray-200 min-h-[300px] sm:min-h-[500px] flex items-center justify-center"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {pageRendering && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50 gap-3">
            <Loader2 size={32} className="animate-spin text-brand-600" />
            <p className="text-sm text-gray-500">Rendering page {currentPage}…</p>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="max-w-full shadow-lg"
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        />
      </div>

      {/* Bottom Bar */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Lock size={12} />
          <span>Protected content — copying or downloading is prohibited</span>
        </div>
        <div className="text-xs text-gray-400">
          Use arrow keys to navigate, +/- to zoom
        </div>
      </div>
    </div>
  );
}
