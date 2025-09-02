'use client';

import React from 'react';
import { TranslationError } from '../page'; // Import the type from your main page

interface AnalysisCardProps {
  error: TranslationError;
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ error }) => {
  return (
    <div className={`p-4 rounded-lg border-t-4 ${error.type === 'mistranslation' ? 'border-red-400 bg-red-50/50' : 'border-yellow-400 bg-yellow-50/50'}`}>
      <div className="text-center mb-4">
        <span className={`inline-block px-4 py-1 text-sm font-semibold rounded-full uppercase tracking-wider ${error.type === 'mistranslation' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {error.type}
        </span>
        <p className="text-xs text-neutral-500 mt-2">
           Page {error.page} &bull; Confidence: {Math.round(error.confidence * 100)}%
        </p>
      </div>
      <hr className="mb-4" />
      <div className="space-y-3 text-sm">
        <div>
          <p className="font-semibold text-neutral-700">Original Text</p>
          <p className="text-neutral-600 italic">"{error.originalText}"</p>
        </div>
        {error.translatedText && (
          <div>
            <p className="font-semibold text-neutral-700">Translation</p>
            <p className="text-neutral-600 italic">"{error.translatedText}"</p>
          </div>
        )}
        <div>
          <p className="font-semibold text-neutral-700">Suggestion</p>
          <p className="text-neutral-800">{error.suggestion}</p>
        </div>
      </div>
    </div>
  );
};