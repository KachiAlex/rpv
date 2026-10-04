'use client';

import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { getCurrentUserEmail } from '@/lib/client-auth';
import { logPageView } from '@/lib/pdf-access-logger';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  // Use locally bundled worker for Capacitor/offline compatibility
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface ProtectedPdfViewerProps {
  pdfUrl: string;
  pageNumber?: number;
  onLoad?: (numPages: number) => void;
  onPageChange?: (page: number) => void;
  bookId?: string;
  bookTitle?: string;
}

export default function ProtectedPdfViewer({ pdfUrl, pageNumber = 1, onLoad, onPageChange, bookId, bookTitle }: ProtectedPdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(pageNumber);
  const [loading, setLoading] = useState(true);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [watermark, setWatermark] = useState<string>('');

  // Get user info for watermark
  useEffect(() => {
    const email = getCurrentUserEmail();
    if (email) {
      setWatermark(`${email} - Authorized Access Only`);
    }
  }, []);

  // Load PDF document
  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        onLoad?.(pdf.numPages);
      } catch (error) {
        console.error('Error loading PDF:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [pdfUrl, onLoad]);

  // Render current page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        setLoading(true);
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // Calculate scale to fit container
        const containerWidth = canvas.parentElement?.clientWidth || 800;
        const viewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        // Render PDF page to canvas (no text layer)
        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
          canvas,
        };

        await page.render(renderContext).promise;

        // Draw watermark overlay
        drawWatermark(context, scaledViewport.width, scaledViewport.height);
      } catch (error) {
        console.error('Error rendering page:', error);
      } finally {
        setLoading(false);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, watermark]);

  const drawWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!watermark) return;

    ctx.save();
    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(128, 128, 128, 0.3)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw watermark diagonally across the page
    const centerX = width / 2;
    const centerY = height / 2;
    
    ctx.translate(centerX, centerY);
    ctx.rotate(-Math.PI / 6);
    ctx.fillText(watermark, 0, 0);
    ctx.fillText(watermark, 0, -30);
    ctx.fillText(watermark, 0, 30);
    
    ctx.restore();
  };

  const handleNextPage = async () => {
    if (currentPage < numPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
      
      // Log page view
      if (bookId && bookTitle) {
        await logPageView(bookId, bookTitle, newPage);
      }
    }
  };

  const handlePrevPage = async () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
      
      // Log page view
      if (bookId && bookTitle) {
        await logPageView(bookId, bookTitle, newPage);
      }
    }
  };

  // Apply protection styles
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common copy/save/print shortcuts
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'c' ||
          e.key === 'C' ||
          e.key === 's' ||
          e.key === 'S' ||
          e.key === 'p' ||
          e.key === 'P' ||
          e.key === 'a' ||
          e.key === 'A')
      ) {
        e.preventDefault();
        return false;
      }

      // Block PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        return false;
      }
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, []);

  return (
    <div className="pdf-viewer-container" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      <div className="pdf-controls flex items-center justify-between mb-4 p-4 bg-gray-100 rounded-lg">
        <button
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="font-semibold">
          Page {currentPage} of {numPages}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage >= numPages}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      <div className="pdf-canvas-wrapper relative bg-gray-200 rounded-lg overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="mx-auto shadow-lg"
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        />
      </div>

      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Protected Content:</strong> This document is protected. Downloading, copying, or printing is
          prohibited. Your access is being logged.
        </p>
      </div>
    </div>
  );
}
