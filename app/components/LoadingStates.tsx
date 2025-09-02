'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProcessingStatus {
  step: 'upload' | 'translating' | 'analyzing' | 'complete';
  progress: number;
  message: string;
}

interface LoadingStateProps {
  status: ProcessingStatus;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ status }) => {
  const { step, progress, message } = status;

  const steps = [
    { key: 'translating', label: 'Translate' },
    { key: 'analyzing', label: 'Analyze' },
    { key: 'complete', label: 'Complete' },
  ];
  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="bg-white rounded-xl shadow-subtle p-8 w-full max-w-lg mx-auto">
      <div className="text-center mb-6">
        <Loader2 className="w-12 h-12 text-brand-primary animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-neutral-800">Processing in Progress</h2>
        <p className="text-neutral-600">{message}</p>
      </div>

      <div className="w-full bg-neutral-200 rounded-full h-2.5 mb-2">
        <div className="bg-brand-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
      </div>
      
      <div className="flex justify-between text-sm text-neutral-500">
        {steps.map((s, i) => (
          <span key={s.key} className={`${i <= currentStepIndex ? 'font-semibold text-brand-primary' : ''}`}>{s.label}</span>
        ))}
      </div>
    </div>
  );
};