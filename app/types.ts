// app/types.ts

// A single coordinate object for a highlight box
export interface HighlightPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

// The main error structure used throughout the app
export interface TranslationError {
  id: string;
  type: 'mistranslation' | 'omission';
  originalText: string;
  translatedText?: string;
  pages: { original: number; translated: number };
  positions: {
    original: HighlightPosition;
    translated: HighlightPosition;
  };
  suggestion: string;
  confidence: number;
}

// BBox is a tuple [x0, y0, x1, y1] from your mock data
export type BBox = [number, number, number, number];

// Structure for the initial mock data, used internally on the page
export interface MockApiError {
  type: 'mistranslation' | 'omission';
  confidence: string;
  original_text: string;
  translated_text?: string;
  suggestion: string;
  pages: { original: number; translated: number };
  bboxes: {
    original: BBox;
    translated: BBox;
  };
}

// State for the main application logic
export interface ProcessingStatus {
  step: 'upload' | 'translating' | 'analyzing' | 'complete';
  progress: number;
  message: string;
}