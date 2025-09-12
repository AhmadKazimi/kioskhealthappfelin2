export type RiskLevel = 'Confirmed' | 'Suspected' | 'HighRisk';

export interface ApiConditionResult {
  Id: number,
  IsDetected: boolean;
  Confidence: number;
  InitialRiskLevel: RiskLevel;
  QuestionnaireRiskLevel: RiskLevel;
  QuestionnaireScore: number;
  Answers: QuestionnaireAnswer[]
}

export interface ConditionWithQuestionnaire extends ApiConditionResult {
  ArrhythmiaName: string;
  questionnaire?: {
    answers: Record<number, string>; 
    score: number;
    calculatedRiskLevel: RiskLevel;
  };
}

export interface Question {
  text: string;
  text_ar?: string;
  type: string; 
  options?: string[];
  options_ar?: string[];
  scoring: Record<string, number>;
}

export interface ConditionQuestionnaire {
  title: string;
  title_ar?: string;
  questions: Question[];
  min_score_threshold: number;
  calculated_max_score: number;
}

export interface QuestionnaireAnswer{
    ArrhythmiaResultId: number,
    Index: number,
    Answer: string
}

export type QuestionnaireData = Record<string, ConditionQuestionnaire>;