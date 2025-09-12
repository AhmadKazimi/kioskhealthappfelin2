import React from 'react';
import { ConditionWithQuestionnaire, QuestionnaireData } from '@/types/conditions';
import { useTranslation } from '@/hooks/useTranslation';

interface SummaryProps {
  conditions: ConditionWithQuestionnaire[];
  questionnaireData: QuestionnaireData;
  onSubmit: () => void;
  onEdit: (conditionName: string) => void;
}

const QuestionnaireSummary: React.FC<SummaryProps> = ({ 
  conditions, 
  questionnaireData, 
  onSubmit, 
  onEdit 
}) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  const conditionsWithQuestionnaires = conditions.filter(
    condition => condition.questionnaire
  );

  return (
    <div className={`max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6 ${isArabic ? 'text-right' : 'text-left'}`}>
      <h2 className={`text-xl font-bold text-gray-800 mb-6 ${isArabic ? 'text-right' : 'text-left'}`}>
        {t('questionnaireSummary.title')}
      </h2>
      <p className={`text-gray-600 mb-8 ${isArabic ? 'text-right' : 'text-left'}`}>
        {t('questionnaireSummary.subtitle')}
      </p>

      <div className="space-y-8">
        {conditionsWithQuestionnaires.map((condition) => {
          const conditionData = questionnaireData[condition.ArrhythmiaName];
          
          return (
            <div key={condition.ArrhythmiaName} className="border border-gray-200 rounded-lg p-5">
              <div className={`flex justify-between items-start mb-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <h3 className={`text-xl font-semibold text-blue-800 ${isArabic ? 'text-right' : 'text-left'}`}>
                  {t(`conditions.${condition.ArrhythmiaName}`)}
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  condition.questionnaire?.calculatedRiskLevel === 'HighRisk' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {condition.questionnaire?.calculatedRiskLevel === 'HighRisk' 
                    ? t('questionnaireSummary.highRisk') 
                    : t('questionnaireSummary.suspected')
                  }
                </span>
              </div>

              <div className={`mb-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                <span className="font-medium">{t('questionnaireSummary.score')}: </span>
                <span>
                  {condition.questionnaire?.score} / {conditionData.calculated_max_score}
                </span>
              </div>

              <div className="space-y-4 mt-4">
                {conditionData.questions.map((question, qIndex) => (
                  <div key={qIndex} className="border-b border-gray-100 pb-1 last:border-0">
                    <p className={`font-medium text-gray-700 ${isArabic ? 'text-right' : 'text-left'}`}>
                      {question.text}
                    </p>
                    <div className={`flex justify-between mt-1 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <p className={`text-gray-600 ${isArabic ? 'text-right' : 'text-left'}`}>
                        {t('questionnaireSummary.answer')}: <span className="font-medium">
                          {condition.questionnaire?.answers[qIndex]}
                        </span>
                      </p>
                      <p className={`text-gray-600 ${isArabic ? 'text-right' : 'text-left'}`}>
                        {t('questionnaireSummary.score')}: {question.scoring[condition.questionnaire?.answers[qIndex] || 0]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onEdit(condition.ArrhythmiaName)}
                className={`mt-2 px-4 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition ${isArabic ? 'text-right' : 'text-left'}`}
              >
                {t('questionnaireSummary.editAnswers')}
              </button>
            </div>
          );
        })}
      </div>

      <div className={`mt-10 pt-6 border-t border-gray-200 flex justify-end space-x-4 ${isArabic ? 'flex-row-reverse space-x-reverse' : ''}`}>
        <button
          onClick={onSubmit}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
        >
          {t('questionnaireSummary.submitAllAnswers')}
        </button>
      </div>
    </div>
  );
};

export default QuestionnaireSummary;