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
    <div className="h-full flex flex-col p-3 sm:p-4 md:p-6 lg:p-10">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
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
              <div 
                key={index} 
                className="flex items-center w-full"
                onClick={(e) => e.stopPropagation()}  
              >
                <div 
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    index <= currentQuestionIndex 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-300 text-gray-600'
                  }`}
                  onClick={(e) => e.preventDefault()} 
                >
                  Q{index + 1}
                </div>

                {index < conditionQuestionnaire.questions.length - 1 && (
                  <div 
                    className={`w-5 sm:w-16 h-0.5 sm:mx-2 transition-all duration-300 ${
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
        </div>
      </div>

      {/* Sticky Button Area */}
      <div className="flex-shrink-0 pt-4">
        <div className="flex justify-between items-center w-full">
          <button
            onClick={() => {
              if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(currentQuestionIndex - 1);
              } else if (onPrev) {
                onPrev();
              }
            }}
            className="cursor-pointer group relative flex items-center justify-center space-x-2 px-4 md:px-6 py-2 md:py-3
                       text-sm md:text-base font-medium text-gray-600 bg-white/80 backdrop-blur-sm
                       border-2 border-gray-300 rounded-xl shadow-sm
                       transition-all duration-300 ease-out
                       hover:border-[#407EFF] hover:text-[#407EFF] hover:bg-white hover:shadow-md
                       focus:outline-none focus:ring-4 focus:ring-[#407EFF]/20
                       active:scale-[0.98]"
          >
            {isArabic ? (
              <svg className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
            <span>{t('buttons.back')}</span>
          </button>

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
            className="cursor-pointer group relative flex items-center justify-center space-x-2 px-4 md:px-6 py-2 md:py-3
                       text-sm md:text-base font-medium text-white bg-gradient-to-r from-[#407EFF] to-[#1E40AF]
                       rounded-xl shadow-lg
                       transition-all duration-300 ease-out
                       hover:shadow-xl hover:scale-[1.02] hover:from-[#1E40AF] hover:to-[#407EFF]
                       focus:outline-none focus:ring-4 focus:ring-[#407EFF]/30
                       active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
          >
            <span>{t('buttons.next')}</span>
            {isArabic ? (
              <svg className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConditionQuestionnaire;