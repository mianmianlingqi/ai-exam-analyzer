export type ExamQuestion = {
  id: string;
  number: string;
  score?: string;
  coreTopic: string;
  finalAnswer: string;
  confidence: "high" | "medium" | "low";
  summary: string;
  steps: string[];
  formulas: string[];
  terminology: string[];
  chartInsights: string[];
};

export type ExamAnalysis = {
  examTitle: string;
  course: string;
  totalQuestions: number;
  extractedTextPreview: string;
  overallInsights: string[];
  questions: ExamQuestion[];
};

export type UploadPhase = "idle" | "uploading" | "analyzing" | "complete" | "error";
