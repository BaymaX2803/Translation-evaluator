'use client';

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

const ResultsView = dynamic(() => import('./components/ResultsView').then(mod => mod.ResultsView), { ssr: false });
const UploadView = dynamic(() => import('./components/UploadView').then(mod => mod.UploadView), { ssr: false });
const PDFViewer = dynamic(() => import('./components/PDFViewer').then(mod => mod.PDFViewer), { ssr: false });

// TYPE DEFINITIONS
interface HighlightPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PageDims {
  width: number;
  height: number;
}

export interface TranslationError {
  id: string;
  type: 'mistranslation' | 'omission';
  originalText: string;
  translatedText?: string;
  pages: { original: number; translated: number; };
  // ✨ UPDATED: Positions now accepts an array of highlights
  positions: {
    original: HighlightPosition[];
    translated: HighlightPosition[];
  };
  suggestion: string;
  confidence: number;
}

type BBox = [number, number, number, number];

interface MockApiError {
  type: 'mistranslation' | 'omission';
  confidence: string;
  original_text: string;
  translated_text?: string;
  suggestion: string;
  pages: { original: number; translated: number; };
  // ✨ UPDATED: Bboxes now accepts an array of coordinates
  bboxes: {
    original: BBox[];
    translated: BBox[];
  };
}

interface ProcessingStatus {
  step: 'upload' | 'translating' | 'analyzing' | 'complete';
  progress: number;
  message: string;
}

const PDFTranslationEvaluator = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>({ step: 'upload', progress: 0, message: 'Ready to upload a PDF for analysis' });
  const [errors, setErrors] = useState<TranslationError[]>([]);
  const [currentErrorIndex, setCurrentErrorIndex] = useState<number | null>(null);
  const [leftPage, setLeftPage] = useState(1);
  const [leftTotalPages, setLeftTotalPages] = useState(0);
  const [rightPage, setRightPage] = useState(1);
  const [rightTotalPages, setRightTotalPages] = useState(0);
  const [originalPdf, setOriginalPdf] = useState<string | File>('');
  const [translatedPdf, setTranslatedPdf] = useState<string>('');

  const [pageDimensions, setPageDimensions] = useState<{
    original: PageDims | null;
    translated: PageDims | null;
  }>({ original: null, translated: null });

  const resetState = () => {
    setUploadedFile(null);
    setStatus({ step: 'upload', progress: 0, message: 'Ready to upload a PDF' });
    setErrors([]);
    setCurrentErrorIndex(null);
    setLeftPage(1);
    setLeftTotalPages(0);
    setRightPage(1);
    setRightTotalPages(0);
    setOriginalPdf('');
    setTranslatedPdf('');
    setPageDimensions({ original: null, translated: null });
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please upload a valid PDF file.');
      return;
    }
    setUploadedFile(file);
    setStatus({ step: 'translating', progress: 10, message: 'Capturing document dimensions...' });
    setOriginalPdf(file);
    setTranslatedPdf('/translated_document.pdf');
  }, []);

  const runAnalysis = useCallback(() => {
    if (!pageDimensions.original || !pageDimensions.translated) {
        console.error("Analysis skipped: Page dimensions not ready.");
        return;
    }

    setStatus(prev => ({ ...prev, progress: 60, message: 'Analyzing translation...' }));
    
    const mockApiErrors: MockApiError[] = [
      { "type": "mistranslation", "confidence": "95%", "original_text": "quarterly earnings releases", "translated_text": "Quartalsmitteilungen", "suggestion": "Mitteilungen means only “announcements” and misses the financial aspect. Better: Quartalsergebnismitteilungen or Gewinnveröffentlichungen.", "pages": { "original": 6, "translated": 6 }, "bboxes": { "original": [[250.42, 463.54, 285.15, 473.63], [33.94, 475.41, 97.63, 485.51]], "translated": [[46.91, 451.66, 124.47, 461.76]] } },
      { "type": "mistranslation", "confidence": "90%", "original_text": "Allianz SE has complied with all recommendations...", "translated_text": "Die Allianz SE entspricht sämtlichen Empfehlungen...", "suggestion": "The German uses present tense “entspricht,” while the English has present perfect “has complied.” More accurate: hat … entsprochen.", "pages": { "original": 8, "translated": 8 }, "bboxes": { "original": [[33.95, 118.59, 258.28, 128.69]], "translated": [[72.71, 106.72, 286.56, 116.81]] } },
      { "type": "mistranslation", "confidence": "90%", "original_text": "adverse impacts", "translated_text": "Belastungen", "suggestion": "Belastungen means “burdens” or “strains.” Better: nachteilige Auswirkungen.", "pages": { "original": 26, "translated": 27 }, "bboxes": { "original": [[177.60, 213.72, 236.74, 223.82]], "translated": [[117.72, 213.72, 163.60, 223.82]] } },
      { "type": "mistranslation", "confidence": "95%", "original_text": "Business Operations", "translated_text": "GESCHÄFTSBEREICHE", "suggestion": "Geschäftsbereiche means business segments. More accurate: Geschäftstätigkeit or Operatives Geschäft.", "pages": { "original": 52, "translated": 54 }, "bboxes": { "original": [[33.95, 45.28, 300.02, 75.03]], "translated": [[33.96, 45.29, 278.77, 75.04]] } },
      { "type": "omission", "confidence": "95%", "original_text": "The Allianz Group serves around 128 million private and corporate customers.", "translated_text": "Der Allianz Konzern betreut rund 128 Millionen Privat- und Firmenkunden", "suggestion": "The English includes a clarifying footnote. This is missing in the German version.", "pages": { "original": 52, "translated": 54 }, "bboxes": { "original": [[146.50, 154.23, 285.15, 164.33], [33.94, 166.11, 190.40, 176.20]], "translated": [[270.33, 166.11, 285.14, 176.20], [33.94, 177.98, 285.15, 188.08], [33.94, 189.86, 85.94, 199.96]] } }
    ];

    const convertBboxToRelative = (bbox: BBox, dims: PageDims): HighlightPosition => {
      const [x0, y0, x1, y1] = bbox;
      return {
        x: x0 / dims.width,
        y: y0 / dims.height,
        width: (x1 - x0) / dims.width,
        height: (y1 - y0) / dims.height,
      };
    };

    const formattedErrors: TranslationError[] = mockApiErrors.map((error) => ({
      id: uuidv4(),
      type: error.type,
      originalText: error.original_text,
      translatedText: error.translated_text,
      suggestion: error.suggestion,
      confidence: parseFloat(error.confidence) / 100,
      pages: error.pages,
      // ✨ UPDATED: Now maps over the array of bboxes for both original and translated text
      positions: {
        original: error.bboxes.original.map(bbox => convertBboxToRelative(bbox, pageDimensions.original!)),
        translated: error.bboxes.translated.map(bbox => convertBboxToRelative(bbox, pageDimensions.translated!)),
      },
    }));

    setErrors(formattedErrors);
    setTimeout(() => {
        setStatus({ step: 'complete', progress: 100, message: 'Analysis complete.' });
    }, 500);
  }, [pageDimensions]);

  useEffect(() => {
    if (status.step === 'translating' && pageDimensions.original && pageDimensions.translated) {
        runAnalysis();
    }
  }, [status.step, pageDimensions, runAnalysis]);

  const handleLeftPageChange = (newPage: number) => { if (newPage > 0 && newPage <= leftTotalPages) setLeftPage(newPage); };
  const handleRightPageChange = (newPage: number) => { if (newPage > 0 && newPage <= rightTotalPages) setRightPage(newPage); };
  const handleSyncedPrev = () => {
    if (leftPage > 1) setLeftPage(leftPage - 1);
    if (rightPage > 1) setRightPage(rightPage - 1);
  };
  const handleSyncedNext = () => {
    if (leftPage < leftTotalPages) setLeftPage(leftPage + 1);
    if (rightPage < rightTotalPages) setRightPage(rightPage + 1);
  };
  const handleSelectError = (errorId: string) => {
    const errorIndex = errors.findIndex(e => e.id === errorId);
    if (errorIndex !== -1) {
      const error = errors[errorIndex];
      setCurrentErrorIndex(errorIndex);
      setLeftPage(error.pages.original);
      setRightPage(error.pages.translated);
    }
  };
  const handleNextError = () => {
    if (errors.length === 0) return;
    const nextIndex = currentErrorIndex === null || currentErrorIndex === errors.length - 1 ? 0 : currentErrorIndex + 1;
    handleSelectError(errors[nextIndex].id);
  };
  const handlePrevError = () => {
    if (errors.length === 0) return;
    const prevIndex = currentErrorIndex === null || currentErrorIndex === 0 ? errors.length - 1 : currentErrorIndex - 1;
    handleSelectError(errors[prevIndex].id);
  };
  const handleExport = () => {
    const dataToExport = errors.map(error => ({
      Type: error.type, 'Original Page': error.pages.original, 'Translated Page': error.pages.translated,
      Confidence: `${Math.round(error.confidence * 100)}%`, 'Original Text': error.originalText,
      'Translated Text': error.translatedText || 'N/A', Suggestion: error.suggestion,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Translation Report");
    XLSX.writeFile(workbook, "Translation_Analysis_Report.xlsx");
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {status.step === 'complete' ? (
        <ResultsView
          errors={errors} originalPdf={originalPdf} translatedPdf={translatedPdf}
          onReset={resetState} onExport={handleExport}
          leftPage={leftPage} leftTotalPages={leftTotalPages}
          onLeftPageChange={handleLeftPageChange} onLeftLoadSuccess={setLeftTotalPages}
          rightPage={rightPage} rightTotalPages={rightTotalPages}
          onRightPageChange={handleRightPageChange} onRightLoadSuccess={setRightTotalPages}
          onNextError={handleNextError} onPrevError={handlePrevError}
          currentErrorIndex={currentErrorIndex}
          onSyncedPrev={handleSyncedPrev} onSyncedNext={handleSyncedNext}
        />
      ) : status.step === 'translating' || status.step === 'analyzing' ? (
        <>
            <UploadView status={status} uploadedFile={uploadedFile} onFileUpload={handleFileUpload} />
            <div className="absolute -z-10 w-0 h-0 overflow-hidden">
                <PDFViewer
                    file={originalPdf}
                    title=""
                    viewerType="original"
                    errors={[]}
                    currentPage={1}
                    totalPages={0}
                    onPageChange={() => {}}
                    onLoadSuccess={() => {}}
                    onPageRender={(dims) => setPageDimensions(prev => ({ ...prev, original: dims }))}
                    currentErrorIndex={null}
                />
                <PDFViewer
                    file={translatedPdf}
                    title=""
                    viewerType="translated"
                    errors={[]}
                    currentPage={1}
                    totalPages={0}
                    onPageChange={() => {}}
                    onLoadSuccess={() => {}}
                    onPageRender={(dims) => setPageDimensions(prev => ({ ...prev, translated: dims }))}
                    currentErrorIndex={null}
                />
            </div>
        </>
      ) : (
        <UploadView status={status} uploadedFile={uploadedFile} onFileUpload={handleFileUpload} />
      )}
    </div>
  );
};

export default PDFTranslationEvaluator;