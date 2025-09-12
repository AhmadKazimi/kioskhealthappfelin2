import { useEffect, useState } from 'react'; 
import Head from 'next/head'; 
import Cookies from 'js-cookie';

import ConditionQuestionnaire from '@/components/condition-questionnaire';
// import QuestionnaireSummary from '@/components/questionnaire-summary';
import { ConditionWithQuestionnaire, QuestionnaireAnswer, QuestionnaireData, RiskLevel } from '@/types/conditions';
import questionnaireData from '@/data/questionnaire.json';
import { useTranslation } from "@/hooks/useTranslation";

    
interface ClientAssessmentProps { 
  onNext: () => void;
  onPrev: () => void;
}

const ClientAssessment = ({onNext, onPrev}: ClientAssessmentProps) => { 
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [conditions, setConditions] = useState<ConditionWithQuestionnaire[]>([]);
  const [currentConditionIndex, setCurrentConditionIndex] = useState(0);
  // const [showSummary, setShowSummary] = useState(false); 
  const [loading, setLoading] = useState(true)
  const [savingResults, setSavingResults] = useState(false)

  const conditionsNeedingQuestionnaires = conditions.filter(
    condition => condition.InitialRiskLevel === 'HighRisk' || condition.InitialRiskLevel === 'Suspected'
  );
 
  const currentCondition = conditionsNeedingQuestionnaires[currentConditionIndex];
  const conditionIndexInOriginalArray = currentCondition ? conditions.findIndex(
    c => c.ArrhythmiaName === currentCondition.ArrhythmiaName
  ) : 0;

  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const userId = Cookies.get('userId');

    useEffect(() => {
        const fetchClientConditions = async () => {
            setLoading(true) 

            try {
                const response = await fetch(`${apiUrl}/Arrhythmia/GetArrhythmiaRequests?clientId=${userId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true",
                    },
                });

                const responseJson = await response.json();
                if (!responseJson.IsSuccess) throw new Error("Failed to fetch data");
                 
                const clientConditions: ConditionWithQuestionnaire[] = responseJson.Result;

                setConditions(clientConditions); 
            } catch (error) {
                console.error("Error fetching user data:", error) ;
            } finally {
                setLoading(false)
            }
        }

        fetchClientConditions()
    }, []);

  const handleQuestionnaireComplete = async (
    conditionIndex: number,
    answers: Record<number, string>,
    score: number,
    calculatedRiskLevel: RiskLevel
  ) => {
    const mappedAnswers: QuestionnaireAnswer[] = Object.entries(answers).map(([index, answer]) =>
    ({
      ArrhythmiaResultId: 0,
      Index: parseInt(index),
      Answer: answer
    }));

    const updatedConditions = [...conditions];
    updatedConditions[conditionIndex] = {
      ...updatedConditions[conditionIndex],
      QuestionnaireRiskLevel: calculatedRiskLevel,
      QuestionnaireScore: score,
      Answers: mappedAnswers,
      questionnaire: {
        answers,
        score,
        calculatedRiskLevel
      }
    };

    setConditions(updatedConditions);

    // Save questionnaire results locally as fallback
    try {
      await saveQuestionnaireResultsLocally(updatedConditions[conditionIndex]);
      console.log("✅ Questionnaire saved to localStorage");
    } catch (localError) {
      console.error("Failed to save to localStorage:", localError);
    }

    if (currentConditionIndex < conditionsNeedingQuestionnaires.length - 1) {
      setCurrentConditionIndex(currentConditionIndex + 1);
    } else {
      // All questionnaires completed - save all results to server at once
      setSavingResults(true);
      try {
        await saveAllQuestionnaireResults(updatedConditions);
        console.log("✅ All questionnaire results saved to database");
      } catch (error) {
        console.error("Failed to save all questionnaire results to database:", error);
        // Fallback already handled above with localStorage saves
      } finally {
        setSavingResults(false);
        onNext();
      }
    }
  };


  // Fallback function to save questionnaire results to localStorage
  const saveQuestionnaireResultsLocally = async (condition: ConditionWithQuestionnaire) => {
    try {
      console.log(`💾 Saving questionnaire results to localStorage for ${condition.ArrhythmiaName}`);
      
      // Save to localStorage with user-specific key
      const storageKey = `questionnaire_${userId}_${condition.ArrhythmiaName}`;
      const questionnaireData = {
        ClientId: userId,
        ArrhythmiaName: condition.ArrhythmiaName,
        QuestionnaireRiskLevel: condition.QuestionnaireRiskLevel,
        QuestionnaireScore: condition.QuestionnaireScore,
        Answers: condition.Answers,
        SavedAt: new Date().toISOString()
      };
      
      localStorage.setItem(storageKey, JSON.stringify(questionnaireData));
      
      // Also save to a master list for easy retrieval
      const masterKey = `questionnaires_${userId}`;
      const existingQuestionnaires = JSON.parse(localStorage.getItem(masterKey) || '[]');
      
      // Remove existing entry for this condition if it exists
      const filteredQuestionnaires = existingQuestionnaires.filter(
        (q: any) => q.ArrhythmiaName !== condition.ArrhythmiaName
      );
      
      // Add the new/updated questionnaire
      filteredQuestionnaires.push(questionnaireData);
      localStorage.setItem(masterKey, JSON.stringify(filteredQuestionnaires));
      
      console.log(`✅ Questionnaire saved to localStorage for ${condition.ArrhythmiaName}`);
      
    } catch (error) {
      console.error(`❌ Error saving questionnaire to localStorage for ${condition.ArrhythmiaName}:`, error);
      throw error;
    }
  };

  // Function to save all questionnaire results at the end via bulk API
  const saveAllQuestionnaireResults = async (conditions: ConditionWithQuestionnaire[]) => {
    try {
      const completedConditions = conditions.filter(c => c.Answers && c.Answers.length > 0);
      
      if (completedConditions.length === 0) {
        console.log("📝 No completed questionnaires to save");
        return;
      }

      console.log(`📋 Bulk saving ${completedConditions.length} completed questionnaires to database:`, 
        completedConditions.map(c => c.ArrhythmiaName));

      // Map conditions to the required API format
      const conditionsData = completedConditions.map(condition => ({
        id: condition.Id || 0,
        creationTime: new Date().toISOString(),
        creatorUserId: 0,
        lastModificationTime: new Date().toISOString(),
        lastModifierUserId: 0,
        detectionRequestId: 0,
        requestId: "string",
        apiName: "string",
        arrhythmiaName: condition.ArrhythmiaName,
        arrhythmiaShortName: condition.ArrhythmiaName,
        confidence: condition.Confidence || 0,
        detected: condition.IsDetected || true,
        errorMessage: "string",
        prediction: "string",
        success: true,
        initialRiskLevel: condition.InitialRiskLevel === 'HighRisk' ? 2 : condition.InitialRiskLevel === 'Suspected' ? 1 : 0,
        questionnaireRiskLevel: condition.QuestionnaireRiskLevel === 'HighRisk' ? 2 : condition.QuestionnaireRiskLevel === 'Suspected' ? 1 : 0,
        questionnaireScore: condition.QuestionnaireScore || 0,
        answers: condition.Answers.map(answer => ({
          id: 0,
          creationTime: new Date().toISOString(),
          creatorUserId: 0,
          lastModificationTime: new Date().toISOString(),
          lastModifierUserId: 0,
          arrhythmiaResultId: answer.ArrhythmiaResultId,
          index: answer.Index,
          answer: answer.Answer
        }))
      }));

      const requestBody = {
        conditions: conditionsData
      };

      const response = await fetch(`${apiUrl}/Arrhythmia/EditArrhythmiaQuestionnaire`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("✅ All questionnaire results saved to database via bulk API call");
      return result;
      
    } catch (error) {
      console.error("❌ Error in saveAllQuestionnaireResults:", error);
      // Re-throw error so it can be handled by the caller with localStorage fallback
      throw error;
    }
  };

  // const handleEditCondition = (conditionName: string) => {
  //   const index = conditionsNeedingQuestionnaires.findIndex(
  //     c => c.ArrhythmiaName === conditionName
  //   );
  //   setCurrentConditionIndex(index);
  //   setShowSummary(false);
  // };
 
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className={`text-center ${isArabic ? 'text-right' : 'text-left'}`}>
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">{t('assessment.loadingClientData')}</p>
        </div>
      </div>
    )
  }

  if (conditionsNeedingQuestionnaires.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">        
        <div className={`bg-white p-8 rounded-lg shadow-md max-w-md text-center ${isArabic ? 'text-right' : 'text-left'}`}>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{t('assessment.complete')}</h1>
          <p className="text-gray-600 mb-6">
            {t('assessment.noQuestionnairesRequired')}
          </p>

          <div className={`flex ${isArabic ? 'flex-row-reverse space-x-reverse' : ''} space-x-2`}>
            <button
              onClick={onPrev}
              className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition" 
            >
              {t('buttons.back')}
            </button>

            <button
              onClick={onNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {t('buttons.continue')}
            </button> 
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Saving Results Overlay */}
      {savingResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center min-w-[300px]">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <div className="text-lg font-medium text-gray-800">{t('assessment.savingResults')}</div>
            <div className="text-sm text-gray-600 mt-2">{t('assessment.pleaseWait')}</div>
          </div>
        </div>
      )}
      <Head>
        <title>{t('assessment.patientAssessment')}</title>
      </Head>

       <div className="max-w-7xl mx-auto">
        <> 
          <h1 className={`text-xl sm:text-3xl font-bold text-blue-600 mb-2 text-center ${isArabic ? 'text-right' : 'text-left'}`}>
            {t('assessment.patientHealthAssessment')}
          </h1>
          <ConditionQuestionnaire
            key={`condition-${currentConditionIndex}`}
            condition={currentCondition}
            questionnaireData={questionnaireData as unknown as QuestionnaireData}
            onComplete={(answers, score, calculatedRiskLevel) =>
                handleQuestionnaireComplete(conditionIndexInOriginalArray, answers, score, calculatedRiskLevel)
            }
            currentConditionIndex={currentConditionIndex}
            totalConditions={conditionsNeedingQuestionnaires.length}
            onPrev={onPrev}
            onNext={onNext}
          />
        </>
      </div>
    </div>

  );
};
  
export default ClientAssessment;