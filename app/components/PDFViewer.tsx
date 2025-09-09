'use client';

import React from 'react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { TranslationError } from '../page';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  file: string | File;
  title: string;
  errors: TranslationError[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLoadSuccess: (pages: number) => void;
  viewerType: 'original' | 'translated';
  onPageRender?: (dimensions: { width: number; height: number; }) => void;
  currentErrorIndex: number | null;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ file, title, errors, currentPage, totalPages, onPageChange, onLoadSuccess, viewerType, onPageRender, currentErrorIndex }) => {
  const [zoom, setZoom] = useState(1);
  const [pageDims, setPageDims] = useState<{ width: number; height: number }>({ width: 600, height: 800 });
  const containerRef = useRef<HTMLDivElement>(null);

  // State to track which highlight ID is active for the shimmer effect
  const [activeId, setActiveId] = useState<string | null>(null);

  const currentPageErrors = useMemo(() =>
    errors.filter(error => error.pages[viewerType] === currentPage),
    [errors, currentPage, viewerType]
  );
  
  const fileUrl = useMemo(() => {
    if (typeof file === 'string') return file;
    if (file instanceof File) return URL.createObjectURL(file);
    return '';
  }, [file]);

  useEffect(() => {
    return () => {
      if (fileUrl && file instanceof File) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl, file]);

  // Effect to handle auto-zoom, smooth scroll, and shimmer animation
  useEffect(() => {
    const selectedError = currentErrorIndex !== null ? errors[currentErrorIndex] : null;

    if (selectedError && selectedError.pages[viewerType] === currentPage && containerRef.current) {
      // 1. Auto-zoom
      setZoom(1.4);
      
      // 2. Trigger the shimmer animation
      setActiveId(selectedError.id);

      // 3. Smoothly scroll to the highlight
      const scrollTimer = setTimeout(() => {
        // ✨ UPDATED: The ID now points to the FIRST highlight box in a potential multi-line group
        const highlightId = `highlight-${viewerType}-${selectedError.id}`;
        const highlightElement = document.getElementById(highlightId);
        const container = containerRef.current;

        if (highlightElement && container) {
          const targetScrollTop = highlightElement.offsetTop + (highlightElement.clientHeight / 2) - (container.clientHeight / 2);
          const targetScrollLeft = highlightElement.offsetLeft + (highlightElement.clientWidth / 2) - (container.clientWidth / 2);

          container.scrollTo({
            top: targetScrollTop,
            left: targetScrollLeft,
            behavior: 'smooth'
          });
        }
      }, 100);
      
      // Clear the active ID after the animation so it can re-run
      const animationTimer = setTimeout(() => {
        setActiveId(null);
      }, 1200); // Must match CSS animation duration

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(animationTimer);
      };
    } else {
      setActiveId(null);
    }
  }, [currentPage, currentErrorIndex, errors, viewerType, pageDims]);


  return (
    <div className="bg-white rounded-lg shadow-subtle flex flex-col h-[75vh]">
      <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200 flex items-center justify-between rounded-t-lg">
        <h3 className="font-semibold text-neutral-800">{title}</h3>
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} className="p-2 hover:bg-neutral-200 rounded-md disabled:opacity-50" disabled={zoom <= 0.5}><ZoomOut className="w-4 h-4" /></button>
          <span className="text-sm text-neutral-600 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-2 hover:bg-neutral-200 rounded-md disabled:opacity-50" disabled={zoom >= 3}><ZoomIn className="w-4 h-4" /></button>
          <div className="w-px h-5 bg-neutral-300 mx-2" />
          <a href={fileUrl} download={`${title.replace(/\s/g, '_')}.pdf`} className="p-2 hover:bg-neutral-200 rounded-md"><Download className="w-4 h-4" /></a>
        </div>
      </div>

      <div ref={containerRef} className="flex-grow overflow-auto p-4 bg-neutral-100">
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => onLoadSuccess(numPages)}
          loading={<div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>}
          error={<div className="text-center p-4 text-red-500">Failed to load page.</div>}
        >
          <div className="m-auto relative" style={{ width: pageDims.width * zoom, height: pageDims.height * zoom }}>
            <div style={{ width: pageDims.width, height: pageDims.height, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
              <Page 
                pageNumber={currentPage} 
                scale={1} 
                onRenderSuccess={(page) => {
                  setPageDims({ width: page.width, height: page.height });
                  if (onPageRender) {
                    onPageRender({ width: page.width, height: page.height });
                  }
                }}
                renderAnnotationLayer={false} 
                renderTextLayer={true} 
                className="shadow-md" 
              />
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                {/* ✨ UPDATED: Logic to handle multiple highlight boxes for a single error */}
                {currentPageErrors.map((error) => {
                  const positions = error.positions[viewerType];
                  if (!positions || positions.length === 0) return null;

                  const isActive = error.id === activeId;
                  const activeClass = isActive ? 'shimmer-effect' : '';

                  // Render a highlight for EACH position in the array
                  return positions.map((position, index) => (
                    <div
                      key={`${error.id}-${index}`} // Unique key for each box
                      // ID is ONLY applied to the FIRST box for scrolling purposes
                      id={index === 0 ? `highlight-${viewerType}-${error.id}` : undefined}
                      title={error.type}
                      className={`absolute rounded-sm ${
                        error.type === 'mistranslation' ? 'bg-red-700/50' : 'bg-yellow-500/50'
                      } ${activeClass}`}
                      style={{
                        left: `${position.x * 100}%`,
                        top: `${position.y * 100}%`,
                        width: `${position.width * 100}%`,
                        height: `${position.height * 100}%`,
                      }}
                    />
                  ));
                })}
              </div>
            </div>
          </div>
        </Document>
      </div>

      <div className="bg-neutral-50 px-4 py-2 border-t border-neutral-200 flex items-center justify-between rounded-b-lg">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1} className="flex items-center gap-1 px-3 py-1 text-sm bg-white border rounded-md hover:bg-neutral-100 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /> Prev</button>
        <span className="text-sm text-neutral-600">Page {currentPage} of {totalPages}</span>
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} className="flex items-center gap-1 px-3 py-1 text-sm bg-white border rounded-md hover:bg-neutral-100 disabled:opacity-50">Next <ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
};