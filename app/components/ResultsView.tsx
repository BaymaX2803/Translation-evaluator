// app/components/ResultsView.tsx
'use client';

import React from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, SkipForward, SkipBack } from 'lucide-react';
import { PDFViewer } from './PDFViewer';
import { AnalysisCard } from './AnalysisCard';
import { TranslationError } from '../page';

// The props interface remains the same
interface ResultsViewProps {
  errors: TranslationError[];
  originalPdf: string | File;
  translatedPdf: string | File;
  onReset: () => void;
  onExport: () => void;
  leftPage: number;
  leftTotalPages: number;
  onLeftPageChange: (page: number) => void;
  onLeftLoadSuccess: (pages: number) => void;
  rightPage: number;
  rightTotalPages: number;
  onRightPageChange: (page: number) => void;
  onRightLoadSuccess: (pages: number) => void;
  onNextError: () => void;
  onPrevError: () => void;
  currentErrorIndex: number | null;
  onSyncedPrev: () => void;
  onSyncedNext: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  errors,
  originalPdf,
  translatedPdf,
  onReset,
  onExport,
  leftPage, leftTotalPages, onLeftPageChange, onLeftLoadSuccess,
  rightPage, rightTotalPages, onRightPageChange, onRightLoadSuccess,
  onNextError,
  onPrevError,
  currentErrorIndex,
  onSyncedPrev, onSyncedNext
}) => {

  const currentError = currentErrorIndex !== null ? errors[currentErrorIndex] : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-900">Translation Analysis</h1>
        <div className="flex items-center space-x-4 text-sm text-neutral-500 mt-2">
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" /><span>{errors.length} issues found</span></div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-10 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PDFViewer
              title="Original (English)"
              file={originalPdf}
              errors={errors}
              currentPage={leftPage}
              totalPages={leftTotalPages}
              onPageChange={onLeftPageChange}
              onLoadSuccess={onLeftLoadSuccess}
              viewerType="original"
              currentErrorIndex={currentErrorIndex} // ✨ ADDED: Pass currentErrorIndex
            />
            <PDFViewer
              title="Translation (German)"
              file={translatedPdf}
              errors={errors}
              currentPage={rightPage}
              totalPages={rightTotalPages}
              onPageChange={onRightPageChange}
              onLoadSuccess={onRightLoadSuccess}
              viewerType="translated"
              currentErrorIndex={currentErrorIndex} // ✨ ADDED: Pass currentErrorIndex
            />
          </div>
          <footer className="p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border flex items-center justify-between">
            <button onClick={onReset} className="px-6 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-800 transition-colors">
              Analyze Another PDF
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={onSyncedPrev}
                disabled={leftPage <= 1 && rightPage <= 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-semibold bg-white border rounded-md hover:bg-neutral-100 disabled:opacity-50"
                title="Co-scroll Back"
              >
                <ChevronLeft className="w-4 h-4" /> Co-scroll Back
              </button>
              <span className="text-sm text-neutral-600 font-medium">Pages {leftPage} | {rightPage}</span>
              <button
                onClick={onSyncedNext}
                disabled={leftPage >= leftTotalPages && rightPage >= rightTotalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm font-semibold bg-white border rounded-md hover:bg-neutral-100 disabled:opacity-50"
                title="Co-scroll Forward"
              >
                Co-scroll <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button onClick={onExport} className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-blue-700 transition-colors">
              Export Report
            </button>
          </footer>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow-subtle p-6 flex flex-col">
          <h3 className="text-xl font-semibold text-neutral-800 border-b pb-3 mb-4">Analysis</h3>
          <div className="flex-grow space-y-4 overflow-y-auto">
            {errors.length === 0 ? (
              <div className="text-center text-neutral-500 pt-8">
                <h4 className="font-semibold text-lg text-neutral-700">No issues found!</h4>
                <p>The AI analysis did not detect any significant translation errors.</p>
              </div>
            ) : currentError ? (
              <AnalysisCard error={currentError} />
            ) : (
              <div className="text-center text-neutral-500 pt-8">
                <h4 className="font-semibold text-lg text-neutral-700">Ready for Review</h4>
                <p>Click "Start Review" to begin.</p>
              </div>
            )}
          </div>
          <div className="w-full mt-4 pt-4 border-t flex flex-col gap-2">
            
            {currentErrorIndex !== null && (
              <button
                onClick={onPrevError}
                disabled={errors.length === 0}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SkipBack className="w-4 h-4" />
                Previous Flag
              </button>
            )}

            <button
              onClick={onNextError}
              disabled={errors.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentErrorIndex === null ? (
                <>
                  <SkipForward className="w-4 h-4" />
                  Start Review
                </>
              ) : (
                <>
                  <SkipForward className="w-4 h-4" />
                  Next Flag
                </>
              )}
            </button>

          </div>
        </div>
      </main>
    </div>
  );
};