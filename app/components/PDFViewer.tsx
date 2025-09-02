'use client';

import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFError {
  id: string;
  type: 'mistranslation' | 'omission';
  position: { x: number; y: number; width: number; height: number };
  page: number;
}

// ✨ RE-ADD props for individual page navigation
interface PDFViewerProps {
  file: string | File;
  title: string;
  errors: PDFError[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLoadSuccess: (pages: number) => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ file, title, errors, currentPage, totalPages, onPageChange, onLoadSuccess }) => {
  const [zoom, setZoom] = useState(1);
  const [pageWidth, setPageWidth] = useState(600);
  
  const currentPageErrors = errors.filter(error => error.page === currentPage);
  
  return (
    <div className="bg-white rounded-lg shadow-subtle flex flex-col h-[75vh]">
      <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200 flex items-center justify-between rounded-t-lg">
        <h3 className="font-semibold text-neutral-800">{title}</h3>
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom((z: number) => Math.max(0.5, z - 0.2))} className="p-2 hover:bg-neutral-200 rounded-md disabled:opacity-50" disabled={zoom <= 0.5}><ZoomOut className="w-4 h-4" /></button>
          <span className="text-sm text-neutral-600 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z: number) => Math.min(3, z + 0.2))} className="p-2 hover:bg-neutral-200 rounded-md disabled:opacity-50" disabled={zoom >= 3}><ZoomIn className="w-4 h-4" /></button>
          <div className="w-px h-5 bg-neutral-300 mx-2" />
          <a href={typeof file === 'string' ? file : URL.createObjectURL(file)} download={`${title.replace(/\s/g, '_')}.pdf`} className="p-2 hover:bg-neutral-200 rounded-md"><Download className="w-4 h-4" /></a>
        </div>
      </div>

      <div className="flex-grow overflow-auto p-4 bg-neutral-100">
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => onLoadSuccess(numPages)}
          loading={<div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>}
          error={<div className="text-center p-4 text-error-red">Failed to load page.</div>}
        >
          <div className="relative mx-auto" style={{ width: pageWidth * zoom }}>
            <Page
              pageNumber={currentPage}
              scale={zoom}
              onRenderSuccess={(page: { width: number }) => setPageWidth(page.width)}
              renderAnnotationLayer={false}
              renderTextLayer={true}
              className="shadow-md"
            />
            {currentPageErrors.map((error) => (
              <div
                key={error.id}
                title={error.type}
                className={`absolute pointer-events-none rounded-sm ${
                  error.type === 'mistranslation' ? 'bg-red-500/30 border-2 border-red-500' : 'bg-yellow-400/30 border-2 border-yellow-500'
                }`}
                style={{
                  left: `${error.position.x * 100}%`,
                  top: `${error.position.y * 100}%`,
                  width: `${error.position.width * 100}%`,
                  height: `${error.position.height * 100}%`,
                }}
              />
            ))}
          </div>
        </Document>
      </div>

      {/* ✨ RE-ADD the footer with individual page controls */}
      <div className="bg-neutral-50 px-4 py-2 border-t border-neutral-200 flex items-center justify-between rounded-b-lg">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1} className="flex items-center gap-1 px-3 py-1 text-sm bg-white border rounded-md hover:bg-neutral-100 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /> Prev</button>
        <span className="text-sm text-neutral-600">Page {currentPage} of {totalPages}</span>
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} className="flex items-center gap-1 px-3 py-1 text-sm bg-white border rounded-md hover:bg-neutral-100 disabled:opacity-50">Next <ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
};