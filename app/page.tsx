'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

const ResultsView = dynamic(() => import('./components/ResultsView').then(mod => mod.ResultsView), { ssr: false });
const UploadView = dynamic(() => import('./components/UploadView').then(mod => mod.UploadView), { ssr: false });

// ✨ EXPORTED this interface so other components can use it
export interface TranslationError {
  id: string;
  type: 'mistranslation' | 'omission';
  originalText: string;
  translatedText?: string;
  page: number;
  position: { x: number; y: number; width: number; height: number };
  suggestion: string;
  confidence: number;
}
interface ApiError {
  type: 'mistranslation' | 'omission';
  confidence: string;
  original_text: string;
  translated_text?: string;
  suggestion: string;
}
interface ProcessingStatus {
  step: 'upload' | 'translating' | 'analyzing' | 'complete';
  progress: number;
  message: string;
}

const PDFTranslationEvaluator = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>({
    step: 'upload',
    progress: 0,
    message: 'Ready to upload a PDF for analysis',
  });
  const [errors, setErrors] = useState<TranslationError[]>([]);
  const [currentErrorIndex, setCurrentErrorIndex] = useState<number | null>(null);
  const [leftPage, setLeftPage] = useState(1);
  const [leftTotalPages, setLeftTotalPages] = useState(0);
  const [rightPage, setRightPage] = useState(1);
  const [rightTotalPages, setRightTotalPages] = useState(0);
  const [originalPdf, setOriginalPdf] = useState<string | File>('');
  const [translatedPdf, setTranslatedPdf] = useState<string>('');

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
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please upload a valid PDF file.');
      return;
    }
    setUploadedFile(file);
    setStatus({ step: 'translating', progress: 10, message: 'Uploading PDF...' });
    setOriginalPdf(file);
    await simulateProcessing(file);
  }, []);

  const simulateProcessing = async (file: File) => {
    await new Promise(r => setTimeout(r, 1500));
    setStatus(prev => ({ ...prev, progress: 30, message: 'Translating document...' }));
    await new Promise(r => setTimeout(r, 1500));
    setStatus(prev => ({ ...prev, progress: 60, message: 'Analyzing translation...' }));
    await new Promise(r => setTimeout(r, 1500));
    const apiErrors: ApiError[] = [
      { "type": "mistranslation", "confidence": "90%", "original_text": "quarterly earnings", "translated_text": "vierteljährliche Einnahmen", "suggestion": "Use 'Gewinne' (profits) for 'earnings', not 'Einnahmen' (revenue)." },
      { "type": "omission", "confidence": "95%", "original_text": "subsidiary operations", "suggestion": "Expected a translation like 'Tochtergesellschaften' but not found." },
      { "type": "omission", "confidence": "95%", "original_text": "reasonable assurance engagement", "suggestion": "Expected a translation like 'Prüfung mit hinreichender Sicherheit' but not found." }
    ];
    const formattedErrors: TranslationError[] = apiErrors.map((error, index) => ({ id: uuidv4(), type: error.type, originalText: error.original_text, translatedText: error.translated_text, suggestion: error.suggestion, confidence: parseFloat(error.confidence) / 100, page: 1, position: { x: 0.1, y: 0.2 + (index * 0.2), width: 0.5, height: 0.05 } }));
    setErrors(formattedErrors);
    setOriginalPdf(file);
    setTranslatedPdf('/translated_document.pdf');
    setStatus({ step: 'complete', progress: 100, message: 'Analysis complete.' });
  };
  
  const handleLeftPageChange = (newPage: number) => { if (newPage > 0 && newPage <= leftTotalPages) setLeftPage(newPage); };
  const handleRightPageChange = (newPage: number) => { if (newPage > 0 && newPage <= rightTotalPages) setRightPage(newPage); };
  
  // ✨ REFINED LOGIC: More direct and clear
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
      setLeftPage(error.page);
      setRightPage(error.page);
    }
  };
  const handleNextError = () => {
    if (errors.length === 0) return;
    const nextIndex = currentErrorIndex === null || currentErrorIndex === errors.length - 1
      ? 0
      : currentErrorIndex + 1;
    handleSelectError(errors[nextIndex].id);
  };
  const handlePrevError = () => {
    if (errors.length === 0) return;
    const prevIndex = currentErrorIndex === null || currentErrorIndex === 0
      ? errors.length - 1
      : currentErrorIndex - 1;
    handleSelectError(errors[prevIndex].id);
  };

  const handleExport = () => {
    const dataToExport = errors.map(error => ({
      Type: error.type,
      Page: error.page,
      Confidence: `${Math.round(error.confidence * 100)}%`,
      'Original Text': error.originalText,
      'Translated Text': error.translatedText || 'N/A',
      Suggestion: error.suggestion,
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
          errors={errors}
          originalPdf={originalPdf}
          translatedPdf={translatedPdf}
          onReset={resetState}
          onExport={handleExport}
          leftPage={leftPage}
          leftTotalPages={leftTotalPages}
          onLeftPageChange={handleLeftPageChange}
          onLeftLoadSuccess={setLeftTotalPages}
          rightPage={rightPage}
          rightTotalPages={rightTotalPages}
          onRightPageChange={handleRightPageChange}
          onRightLoadSuccess={setRightTotalPages}
          onNextError={handleNextError}
          onPrevError={handlePrevError}
          currentErrorIndex={currentErrorIndex}
          onSyncedPrev={handleSyncedPrev}
          onSyncedNext={handleSyncedNext}
        />
      ) : (
        <UploadView
          status={status}
          uploadedFile={uploadedFile}
          onFileUpload={handleFileUpload}
        />
      )}
    </div>
  );
};

export default PDFTranslationEvaluator;