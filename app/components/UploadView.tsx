'use client';

import React from 'react';
import { Upload, FileText } from 'lucide-react';
import { LoadingState } from './LoadingStates';

interface ProcessingStatus {
  step: 'upload' | 'translating' | 'analyzing' | 'complete';
  progress: number;
  message: string;
}

interface UploadViewProps {
  status: ProcessingStatus;
  uploadedFile: File | null;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const UploadView: React.FC<UploadViewProps> = ({ status, uploadedFile, onFileUpload }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center animate-fade-in">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-3">AI Translation Evaluator</h1>
        <p className="text-lg text-neutral-500 mb-8">
          Upload an English PDF to translate into German. Our AI will analyze the translation for accuracy and quality.
        </p>
        
        {status.step !== 'upload' ? (
          <LoadingState status={status} />
        ) : (
          <div className="bg-white rounded-xl shadow-subtle p-8">
            <label htmlFor="pdf-upload" className="relative block w-full p-10 text-center border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-brand-primary hover:bg-brand-secondary transition-colors">
              <input id="pdf-upload" type="file" className="sr-only" accept=".pdf" onChange={onFileUpload} />
              <div className="flex flex-col items-center justify-center">
                <Upload className="w-12 h-12 text-neutral-400 mb-4" />
                <span className="text-lg font-semibold text-neutral-700">Click to upload or drag & drop</span>
                <span className="text-neutral-500 mt-1">PDF only (max 10MB)</span>
              </div>
            </label>
            {uploadedFile && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg flex items-center gap-4 text-left">
                <FileText className="w-8 h-8 text-brand-primary flex-shrink-0" />
                <div>
                  <p className="font-semibold text-neutral-800">{uploadedFile.name}</p>
                  <p className="text-sm text-neutral-600">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};