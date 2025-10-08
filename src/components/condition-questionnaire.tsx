/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-wrapper-object-types */
/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react';
import { QuestionnaireData, ConditionWithQuestionnaire, RiskLevel } from '@/types/conditions';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  condition: ConditionWithQuestionnaire;
  questionnaireData: QuestionnaireData;
  onComplete: (answers: Record<number, string>, score: number, calculatedRiskLevel: RiskLevel) => void;
  currentConditionIndex: number;
  totalConditions: number;
  onPrev?: () => void;
  onNext?: () => void;
}

const ConditionQuestionnaire = ({ condition, questionnaireData, onComplete, currentConditionIndex, totalConditions, onPrev, onNext }: Props) => {
  const { t, i18n } = useTranslation();
  const [currentConditionProgressIndex, setCurrentConditionProgressIndex] = useState(currentConditionIndex);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const conditionQuestionnaire = questionnaireData[condition.ArrhythmiaName];

  // Check if current language is Arabic
  const isArabic = i18n.language === 'ar';

  if (!conditionQuestionnaire) {
    return <div>{t('assessment.noQuestionnaireAvailable')}</div>;
  }

  const currentQuestion = conditionQuestionnaire.questions[currentQuestionIndex];

  // Get localized text for current question
  const getQuestionText = () => {
    return isArabic && currentQuestion.text_ar ? currentQuestion.text_ar : currentQuestion.text;
  };

  // Get localized title for current condition
  const getConditionTitle = () => {
    return isArabic && conditionQuestionnaire.title_ar ? conditionQuestionnaire.title_ar : conditionQuestionnaire.title;
  };

  // Get localized options for multiple choice questions
  const getLocalizedOptions = () => {
    if (currentQuestion.type === 'multiple_choice') {
      return isArabic && currentQuestion.options_ar ? currentQuestion.options_ar : currentQuestion.options;
    }
    return currentQuestion.options;
  };

  const handleAnswer = (answer: string) => {
    const newAnswers = { ...answers, [currentQuestionIndex]: answer };
    setAnswers(newAnswers);

    if (currentQuestionIndex < conditionQuestionnaire.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } 
    else {
      // Calculate score when all questions are answered
      const score = conditionQuestionnaire.questions.reduce((total, question, index) => {
        const answer = newAnswers[index];
        return total + (answer ? question.scoring[answer] : 0);
      }, 0);

      const calculatedRiskLevel: RiskLevel = score >= conditionQuestionnaire.min_score_threshold ? 'HighRisk' : 'Suspected'; 
      setCurrentConditionProgressIndex(currentConditionProgressIndex + 1); 

      onComplete(newAnswers, score, calculatedRiskLevel);
    }
  };

  const handleQuestionNavigation = (index: number) => {
    if (index < conditionQuestionnaire.questions.length && answers[index] !== undefined) {
      setCurrentQuestionIndex(index);
    }
  };

  const getProgressPercentage = () => {
    return Math.round(((currentConditionIndex + 1) / totalConditions) * 100);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Assessment Progress Section */}
      <div className="mb-8">
        <h2 className="text-sm sm:text-lg font-semibold text-gray-700 mb-4">
          {t('assessment.assessmentProgress')}
        </h2>
        <div className="mb-4">
          <span className="text-gray-600 text-sm sm:text-lg font-medium">
            {t('assessment.condition')} {currentConditionIndex + 1} {t('assessment.of')} {totalConditions} ({getProgressPercentage()}%)
          </span>
        </div>
        <div className="w-full  rounded-full h-3 overflow-hidden gap-x-4 flex items-center">
          {Array.from({ length: totalConditions }, (_, index) => (
            <div
              key={index}
              className={`h-full transition-all duration-300   rounded-full  border-r-2 border-[#4481F6] ${
                index === currentConditionIndex 
                  ?'bg-[#4481F6]' 
                  : index < currentConditionIndex 
                  ?'bg-[#4481F6]'
                  : 'bg-gray-300'
              }`}
              style={{ width: `${100 / totalConditions}%` }}
            ></div>
          ))}
        </div>
      </div>

  

      {/* Question Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center sm:space-x-2 px-6 md:px-2 space-x-0">
          {conditionQuestionnaire.questions.map((_, index) => (
            <div key={index} className="flex items-center w-full">
              <div 
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  index <= currentQuestionIndex 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                Q{index + 1}
              </div>
              {index < conditionQuestionnaire.questions.length - 1 && (
                <div 
                  className={`w-5 sm:w-16 h-0.5  sm:mx-2 transition-all duration-300 ${
                    index < currentQuestionIndex ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Question Box */}
      <div className="bg-blue-50 p-2 sm:p-4 rounded-lg mb-2 sm:mb-3">
        <div className="mb-4">
          <span className="text-sm sm:text-lg font-semibold text-gray-800">
            {t('assessment.question')} {currentQuestionIndex + 1}
          </span>
        </div>
        <p className="text-sm sm:text-lg text-gray-700 leading-relaxed">
          {getQuestionText()}
        </p>
      </div>

      {/* Answer Buttons */}
      {currentQuestion.type === 'yes_no' ? (
        <div className="flex space-x-6 mb-8">
          <button 
            onClick={() => handleAnswer('Yes')} 
            className="flex-1 py-2 sm:py-4 px-2 sm:px-8  bg-white border border-gray-300 rounded-lg text-gray-800 font-medium hover:bg-gray-50 transition-colors duration-200 text-sm sm:text-lg"
          >
            {t('assessment.yes')}
          </button>
          <button 
            onClick={() => handleAnswer('No')} 
            className="flex-1 py-2 sm:py-4 px-2 sm:px-8  bg-white border border-gray-300 rounded-lg text-gray-800 font-medium hover:bg-gray-50 transition-colors duration-200 text-sm sm:text-lg"
          >
            {t('assessment.no')}
          </button>
        </div>
      ) : (
        <div className="mb-8">
          <select 
            onChange={(e) => handleAnswer(e.target.value)} 
            value={answers[currentQuestionIndex] || ''}
            className="w-full p-2 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-lg"
          >
            <option value="">{t('assessment.selectOption')}</option>
            {getLocalizedOptions()?.map((option, index) => {
              const originalOption = currentQuestion.options?.[index];
              return (
                <option key={originalOption || option} value={originalOption || option}>
                  {option}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(currentQuestionIndex - 1);
              } else if (onPrev) {
                onPrev();
              }
            }}
            className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors duration-200"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-gray-600 font-medium">{t('buttons.back')}</span>
        </div>

        <div className="flex items-center space-x-2">
            <span className="text-gray-600 font-medium">{t('buttons.next')}</span>
          <button
            onClick={() => {
              if (currentQuestionIndex < conditionQuestionnaire.questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
              } else if (Object.keys(answers).length === conditionQuestionnaire.questions.length) {
                const score = conditionQuestionnaire.questions.reduce((total, question, index) => {
                  return total + question.scoring[answers[index]];
                }, 0);
                const calculatedRiskLevel = score >= conditionQuestionnaire.min_score_threshold ? 'HighRisk' : 'Suspected';
                onComplete(answers, score, calculatedRiskLevel);
              }
            }}
            disabled={!answers[currentQuestionIndex]}
            className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConditionQuestionnaire;