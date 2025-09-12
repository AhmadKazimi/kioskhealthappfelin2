/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, Calendar } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import type { Assessment, HealthTrend } from "@/types/data-service"
import { ClientProfile, LatestReading } from "@/types/client-profile" 

import { QuestionnaireData } from "@/types/conditions"
import questionnaireData from '@/data/questionnaire.json';
import ConditionItem from "./condition-item"
import { useTranslation } from "@/hooks/useTranslation"

interface UserProfileProps {
  onBack: () => void
  clientId?: string
}

// Add new interface for ArrhythmiaRisk
interface ArrhythmiaRisk {
  id: string
  user_id: string
  condition_name: string
  confidence_ratio: number
  is_detected: boolean
  created_at: string
  updated_at: string
}
 
export default function UserProfile({ onBack, clientId = "" }: UserProfileProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("current-status")
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<ClientProfile | null>(null)
  // const [user, setUser] = useState<User | null>(null)
  const [latestReading, setLatestReading] = useState<LatestReading | null>(null)
  const [trends, setTrends] = useState<Record<string, HealthTrend>>({})
  const [assessments, setAssessments] = useState<Assessment[]>([]) 

  //const [arrhythmiaRisks, setArrhythmiaRisks] = useState<ArrhythmiaRisk[]>([]) 
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true) 

      try {
        const response = await fetch(`${apiUrl}/Client/GetClientProfile?clientId=${clientId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true",
            },
        });

        const responseJson = await response.json();
        if (!responseJson.IsSuccess) throw new Error("Failed to fetch data");
         
        const clientProfile: ClientProfile = responseJson.Result;
        
        // Enhance ArrhythmiaRisks with localStorage questionnaire data if server data is empty
        if (clientProfile.ArrhythmiaRisks && clientProfile.ArrhythmiaRisks.length > 0) {
          const masterKey = `questionnaires_${clientId}`;
          const localQuestionnaires = JSON.parse(localStorage.getItem(masterKey) || '[]');
          
          console.log('🔍 Local questionnaires found:', localQuestionnaires);
          
          clientProfile.ArrhythmiaRisks = clientProfile.ArrhythmiaRisks.map(risk => {
            // If server doesn't have answers, try to get them from localStorage
            if (!risk.Answers || risk.Answers.length === 0) {
              const localQuestionnaire = localQuestionnaires.find(
                (q: any) => q.ArrhythmiaName === risk.ArrhythmiaName
              );
              
              if (localQuestionnaire) {
                console.log(`📝 Found local questionnaire for ${risk.ArrhythmiaName}:`, localQuestionnaire);
                return {
                  ...risk,
                  Answers: localQuestionnaire.Answers,
                  QuestionnaireRiskLevel: localQuestionnaire.QuestionnaireRiskLevel,
                  QuestionnaireScore: localQuestionnaire.QuestionnaireScore
                };
              }
            }
            return risk;
          });
        }
 
        setClient(clientProfile);
        if(clientProfile.LatestReadings.length > 0){
          setLatestReading(clientProfile.LatestReadings[0]);
        } 
        setTrends({
          "3day": {
            id: "1",
            user_id: "87230325",
            trend_type: "3day",
            blood_pressure_avg: "111/71",
            spo2_avg: 89,
            heart_rate_avg: 57,
            respiration_rate_avg: 14,
            temperature_avg: 36.4,
            glucose_avg: 76.71,
            hba1c_avg: 21.4,
            bmi_avg: 23,
            blood_pressure_trend: "Stable",
            spo2_trend: "Increasing",
            heart_rate_trend: "Decreasing",
            respiration_rate_trend: "Stable",
            temperature_trend: "Decreasing",
            glucose_trend: "Increasing",
            hba1c_trend: "Decreasing",
            bmi_trend: "Increasing",
            calculated_at: new Date().toISOString(),
          },
          "7day": {
            id: "2",
            user_id: "87230325",
            trend_type: "7day",
            blood_pressure_avg: "102/73",
            spo2_avg: 87,
            heart_rate_avg: 62,
            respiration_rate_avg: 14,
            temperature_avg: 37.4,
            glucose_avg: 62.36,
            hba1c_avg: 22.4,
            bmi_avg: 18,
            blood_pressure_trend: "Stable",
            spo2_trend: "Decreasing",
            heart_rate_trend: "Decreasing",
            respiration_rate_trend: "Decreasing",
            temperature_trend: "Decreasing",
            glucose_trend: "Decreasing",
            hba1c_trend: "Decreasing",
            bmi_trend: "Decreasing",
            calculated_at: new Date().toISOString(),
          },
          "14day": {
            id: "3",
            user_id: "87230325",
            trend_type: "14day",
            blood_pressure_avg: "102/75",
            spo2_avg: 88,
            heart_rate_avg: 64,
            respiration_rate_avg: 15,
            temperature_avg: 37.9,
            glucose_avg: 68.1,
            hba1c_avg: 24.1,
            bmi_avg: 20,
            blood_pressure_trend: "Stable",
            spo2_trend: "Decreasing",
            heart_rate_trend: "Decreasing",
            respiration_rate_trend: "Decreasing",
            temperature_trend: "Decreasing",
            glucose_trend: "Decreasing",
            hba1c_trend: "Decreasing",
            bmi_trend: "Decreasing",
            calculated_at: new Date().toISOString(),
          },
        })

        setAssessments([
          {
            id: "1",
            user_id: "87230325",
            assessment_type: "Fall risk",
            assessment_url: "#",
            created_at: new Date().toISOString(),
          },
          {
            id: "2",
            user_id: "87230325",
            assessment_type: "Critical condition",
            assessment_url: "#",
            created_at: new Date().toISOString(),
          },
          {
            id: "3",
            user_id: "87230325",
            assessment_type: "Depression",
            assessment_url: "#",
            created_at: new Date().toISOString(),
          },
          {
            id: "4",
            user_id: "87230325",
            assessment_type: "Anxiety",
            assessment_url: "#",
            created_at: new Date().toISOString(),
          },
        ]) 
      } catch (error) {
        console.error("Error fetching user data:", error)
         
        setTrends({
          "3day": {
            id: "1",
            user_id: "87230325",
            trend_type: "3day",
            blood_pressure_avg: "111/71",
            spo2_avg: 89,
            heart_rate_avg: 57,
            respiration_rate_avg: 14,
            temperature_avg: 36.4,
            glucose_avg: 76.71,
            hba1c_avg: 21.4,
            bmi_avg: 23,
            blood_pressure_trend: "Stable",
            spo2_trend: "Increasing",
            heart_rate_trend: "Decreasing",
            respiration_rate_trend: "Stable",
            temperature_trend: "Decreasing",
            glucose_trend: "Increasing",
            hba1c_trend: "Decreasing",
            bmi_trend: "Increasing",
            calculated_at: new Date().toISOString(),
          },
          "7day": {
            id: "2",
            user_id: "87230325",
            trend_type: "7day",
            blood_pressure_avg: "102/73",
            spo2_avg: 87,
            heart_rate_avg: 62,
            respiration_rate_avg: 14,
            temperature_avg: 37.4,
            glucose_avg: 62.36,
            hba1c_avg: 22.4,
            bmi_avg: 18,
            blood_pressure_trend: "Stable",
            spo2_trend: "Decreasing",
            heart_rate_trend: "Decreasing",
            respiration_rate_trend: "Decreasing",
            temperature_trend: "Decreasing",
            glucose_trend: "Decreasing",
            hba1c_trend: "Decreasing",
            bmi_trend: "Decreasing",
            calculated_at: new Date().toISOString(),
          },
          "14day": {
            id: "3",
            user_id: "87230325",
            trend_type: "14day",
            blood_pressure_avg: "102/75",
            spo2_avg: 88,
            heart_rate_avg: 64,
            respiration_rate_avg: 15,
            temperature_avg: 37.9,
            glucose_avg: 68.1,
            hba1c_avg: 24.1,
            bmi_avg: 20,
            blood_pressure_trend: "Stable",
            spo2_trend: "Decreasing",
            heart_rate_trend: "Decreasing",
            respiration_rate_trend: "Decreasing",
            temperature_trend: "Decreasing",
            glucose_trend: "Decreasing",
            hba1c_trend: "Decreasing",
            bmi_trend: "Decreasing",
            calculated_at: new Date().toISOString(),
          },
        })

        setAssessments([
          {
            id: "1",
            user_id: "87230325",
            assessment_type: "Fall risk",
            assessment_url: "#",
            created_at: new Date().toISOString(),
          },
          {
            id: "2",
            user_id: "87230325",
            assessment_type: "Critical condition",
            assessment_url: "#",
            created_at: new Date().toISOString(),
          },
          {
            id: "3",
            user_id: "87230325",
            assessment_type: "Depression",
            assessment_url: "#",
            created_at: new Date().toISOString(),
          },
          {
            id: "4",
            user_id: "87230325",
            assessment_type: "Anxiety",
            assessment_url: "#",
            created_at: new Date().toISOString(),
          },
        ])
 
      } finally {
        setLoading(false)
      }
    }
  
    fetchUserData(); 
  }, [clientId])

   function formatDate(dateString: string) {
    if (!dateString) return t('userProfile.messages.na');
    try {
      const date = new Date(dateString);
      const longDate = date.toISOString().split('T')[0];
      const time = date.toISOString().split('T')[1].split('.')[0]
      return longDate + " " + time ;
    } catch (e) {
      return dateString;
    }
  } 

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "Increasing":
        return "bg-amber-500 text-white px-2 py-1"
      case "Decreasing":
        return "bg-amber-500 text-white px-2 py-1"
      default:
        return "bg-gray-50 text-gray-800 px-2 py-1"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">{t('userProfile.messages.loading')}</p>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">{t('userProfile.messages.clientNotFound')}</p>
          <Button onClick={onBack}>{t('userProfile.messages.goBack')}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md py-4 px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
              <ChevronLeft className="h-6 w-6" />
              <span className="sr-only">{t('userProfile.backButton')}</span>
            </Button>
            <div>
              <span className="text-lg font-medium text-blue-700">{t('userProfile.memberRiskStatus')}</span>
              <span className="mx-4 text-gray-300">|</span>
              <span className="text-lg font-medium text-gray-500">{t('userProfile.settings')}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4">
        <div className="grid grid-cols-4 gap-6">
          {/* Left sidebar with user info and navigation */}
          <div className="col-span-1">
            <div className="bg-white p-6 mb-4 border rounded-md flex flex-col items-center shadow-sm">
              <div className="w-32 h-32 bg-gray-100 rounded-full mb-4 flex items-center justify-center">
                <svg className="w-24 h-24 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
              </div>
            </div>

            <div className="bg-white border rounded-md overflow-hidden shadow-sm">
              <button
                className={`w-full py-3 px-6 text-left font-medium ${
                  activeTab === "current-status" ? "bg-teal-600 text-white" : "hover:bg-gray-50 text-gray-700"
                }`}
                onClick={() => setActiveTab("current-status")}
              >
                {t('userProfile.patientProfile')}
              </button>
              {/* <button
                className={`w-full py-3 px-6 text-left font-medium ${
                  activeTab === "profile-info" ? "bg-teal-600 text-white" : "hover:bg-gray-50 text-gray-700"
                }`}
                onClick={() => setActiveTab("profile-info")}
              >
                PROFILE INFO
              </button>
              <button
                className={`w-full py-3 px-6 text-left font-medium ${
                  activeTab === "sleep-summary" ? "bg-teal-600 text-white" : "hover:bg-gray-50 text-gray-700"
                }`}
                onClick={() => setActiveTab("sleep-summary")}
              >
                SLEEP SUMMARY
              </button>
              <button
                className={`w-full py-3 px-6 text-left font-medium ${
                  activeTab === "biometric-history" ? "bg-teal-600 text-white" : "hover:bg-gray-50 text-gray-700"
                }`}
                onClick={() => setActiveTab("biometric-history")}
              >
                BIOMETRIC HISTORY
              </button>
              <button
                className={`w-full py-3 px-6 text-left font-medium ${
                  activeTab === "assessments" ? "bg-teal-600 text-white" : "hover:bg-gray-50 text-gray-700"
                }`}
                onClick={() => setActiveTab("assessments")}
              >
                ASSESSMENTS
              </button> */}
            </div>
          </div>

          {/* Main content area */}
          <div className="col-span-3">
            <Card className="p-6 mb-6 shadow-sm">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-blue-700">{client.ClientInfo.FullName}</h1>
                {/* <Button variant="outline" className="text-blue-600 hover:bg-blue-50">
                  Edit Patient
                </Button> */}
              </div>
            </Card>

            {/* Current Status Tab */}
            {activeTab === "current-status" && (
              <Card className="p-6 shadow-sm space-y-8">
                {/* PERSONAL INFORMATION Section */} 
                <h2 className="text-xl font-semibold mb-6 text-blue-700 border-b pb-2">{t('userProfile.personalInformation')}</h2>
                <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-10">
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.age')}:</span>
                    <span>{client.ClientInfo.Age || t('userProfile.messages.na')}</span>
                  </div>
                  {/* <div className="flex">
                    <span className="font-medium w-24">Race:</span>
                    <span>{client.ClientInfo.Race || "N/A"}</span>
                  </div> */}
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.gender')}:</span>
                    <span>{client.ClientInfo.Gender || t('userProfile.messages.na')}</span>
                  </div>
                  {/* <div className="flex">
                    <span className="font-medium w-24">State:</span>

                    <span>{client.ClientInfo.State || "N/A"}</span>
                  </div> */}
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.nationality')}:</span>
                    <span>{client.Nationality || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.email')}:</span>
                    <span>{client.ClientInfo.Email || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.phone')}:</span>
                    <span>{client.ClientInfo.Phone || t('userProfile.messages.na')}</span>
                  </div>
                  {/* <div className="flex">
                    <span className="font-medium w-24">Provider:</span>
                    <span>{client.ClientInfo.Provider || "N/A"}</span>
                  </div> */}
                  {/* <div className="flex">
                    <span className="font-medium w-24">Product:</span>
                    <span>{client.ClientInfo.Product || "N/A"}</span>
                  </div> */}
                  {/* <div className="flex">
                    <span className="font-medium w-24">mia Health Score:</span>
                    <span>{client.ClientInfo.MiaHealthScore || "N/A"}</span>
                  </div> */}
                </div>

                {/* Vital Signs Section */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-blue-700">{t('userProfile.vitals.latestVitalSigns')}</h2>
                  {latestReading && (
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-lg mb-2">{t('userProfile.vitals.heartRate')}: {latestReading.HeartRate || t('userProfile.messages.na')} {t('userProfile.vitals.bpm')}</p>
                        <p className="text-lg mb-2">{t('userProfile.vitals.bloodPressure')}: {latestReading.BloodPressure || t('userProfile.messages.na')}</p>
                        <p className="text-lg mb-2">{t('userProfile.vitals.heartRateVariability')}: {latestReading.HeartRateVariability || t('userProfile.messages.na')} {t('userProfile.vitals.ms')}</p>
                        <p className="text-lg mb-2">{t('userProfile.vitals.respirationRate')}: {latestReading.RespirationRate || t('userProfile.messages.na')} {t('userProfile.vitals.bps')}</p>
                      </div>
                  </div>
                  )} 
                </div>

                {/* Reported Symptoms Section */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-blue-700">{t('userProfile.sections.reportedSymptoms')}</h2>
                  <ul className="list-disc list-inside">
                    <li>{client.ClientInfo.HealthConcern || t('userProfile.messages.noSymptomsReported')}</li>
                  </ul>
                </div>

                {/* Suggested Care Section */}
                {/* <div>
                  <h2 className="text-xl font-semibold mb-4 text-blue-700">Suggested Care</h2>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-700 mb-2">Emergency Department</h3>
                    <p className="text-red-600">Based on your symptoms and vital signs, immediate medical attention is recommended.</p>
                  </div>
                </div> */}

                {/* Possible Causes Section */}
                {/* {client.PossibleCauses.length > 0 &&(
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-blue-700">Possible Causes</h2>
                    <div className="space-y-2">
                      {client.PossibleCauses.map((cause) => (
                        <div className="flex justify-between items-center">
                          <span>{cause.PossibleCause}</span>
                          <span className={(cause.Level == "common" ? "bg-red-100 text-red-700" : cause.Level == "rare" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700") + "px-2 py-1 rounded text-sm" } >{cause.Level}</span>
                        </div>
                      ))} 
                    </div>
                  </div>
                )} */}
                 
                {/* Health Risk Report Section */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-blue-700">{t('userProfile.sections.healthRiskReport')}</h2>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">{t('userProfile.sections.arrhythmiaDetection')}</h3>
                    <div className="space-y-4">
                      {client.ArrhythmiaRisks.length > 0 ? 
                      client.ArrhythmiaRisks.sort((a, b) => {
                          // First sort by is_detected (true comes first)
                          if (a.Detected !== b.Detected) {
                            return b.Detected ? 1 : -1;
                          }
                          // Then sort by confidence_ratio in descending order
                          return b.Confidence - a.Confidence;
                        })
                        .map((risk) => (
                          <ConditionItem 
                            key={risk.Id} 
                            risk={risk} 
                            questionnaireData={questionnaireData as unknown as QuestionnaireData} 
                          />
                        )) : t('userProfile.messages.shouldDoFaceScan')}
                    </div>
                  </div>
                </div> 

                {/* Latest Readings Section */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-blue-700">{t('userProfile.sections.latestReadings')}</h2> 

                  <div className="space-y-6">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-medium">{t('userProfile.vitals.bloodPressure')}</TableHead> 
                            {/* <TableHead className="font-medium">SPO2</TableHead> */}
                            <TableHead className="font-medium">{t('userProfile.vitals.heartRate')}</TableHead>
                            <TableHead className="font-medium">{t('userProfile.vitals.respirationRate')}</TableHead>
                            <TableHead className="font-medium">{t('userProfile.vitals.temperature')}</TableHead>
                            <TableHead className="font-medium">{t('userProfile.vitals.glucose')}</TableHead>
                            <TableHead className="font-medium">{t('userProfile.vitals.hba1c')}</TableHead>
                            <TableHead className="font-medium">{t('userProfile.vitals.bmi')}</TableHead>
                            <TableHead className="font-medium">{t('userProfile.scanDate')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody> 
                          {client && client.LatestReadings.length > 0 ? (
                            client.LatestReadings.map((latestClientReading) => (
                              <TableRow
                                key={latestClientReading.Id}
                                className="cursor-pointer hover:bg-gray-50"
                              >
                                <TableCell>{latestClientReading.BloodPressure}</TableCell> 
                                {/* <TableCell>{client.LatestReading.SPO2 ?? 0}</TableCell>  */}
                                <TableCell>{latestClientReading.HeartRate}</TableCell>
                                <TableCell>{latestClientReading.RespirationRate}</TableCell>
                                <TableCell>{latestClientReading.Temperature ?? 0}</TableCell>
                                <TableCell>{latestClientReading.Glucose ?? 0}</TableCell>
                                <TableCell>{latestClientReading.Hba1c ?? 0}</TableCell>
                                <TableCell>{latestClientReading.BmiScore ?? 0}</TableCell>
                                <TableCell>{formatDate(latestClientReading.CreationTime)}</TableCell> 
                              </TableRow>
                            ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                                  {t('userProfile.messages.noRecordsFound')}
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody> 
                      </Table>
                    </div>

                      {/* Trend sections */}
                      {/* {Object.entries(trends).map(([period, trend]) => (
                        <div key={period} className="space-y-4">
                          <h2 className="text-lg font-semibold text-gray-700">
                            {period === "3day" ? "3 Day Trend" : period === "7day" ? "7 Day Trend" : "14 Day Trend"}
                          </h2>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableBody>
                                <TableRow className="bg-gray-50">
                                  <TableCell className="font-medium">Average</TableCell>
                                  <TableCell>{trend.blood_pressure_avg}</TableCell>
                                  <TableCell>{trend.spo2_avg}</TableCell>
                                  <TableCell>{trend.heart_rate_avg}</TableCell>
                                  <TableCell>{trend.respiration_rate_avg}</TableCell>
                                  <TableCell>{trend.temperature_avg}</TableCell>
                                  <TableCell>{trend.glucose_avg}</TableCell>
                                  <TableCell>{trend.hba1c_avg}</TableCell>
                                  <TableCell>{trend.bmi_avg}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">Trend</TableCell>
                                  <TableCell className={`${getTrendColor(trend.blood_pressure_trend)} rounded-md text-center`}>
                                    {trend.blood_pressure_trend}
                                  </TableCell>
                                  <TableCell className={`${getTrendColor(trend.spo2_trend)} rounded-md text-center`}>
                                    {trend.spo2_trend}
                                  </TableCell>
                                  <TableCell className={`${getTrendColor(trend.heart_rate_trend)} rounded-md text-center`}>
                                    {trend.heart_rate_trend}
                                  </TableCell>
                                  <TableCell className={`${getTrendColor(trend.respiration_rate_trend)} rounded-md text-center`}>
                                    {trend.respiration_rate_trend}
                                  </TableCell>
                                  <TableCell className={`${getTrendColor(trend.temperature_trend)} rounded-md text-center`}>
                                    {trend.temperature_trend}
                                  </TableCell>
                                  <TableCell className={`${getTrendColor(trend.glucose_trend)} rounded-md text-center`}>
                                    {trend.glucose_trend}
                                  </TableCell>
                                  <TableCell className={`${getTrendColor(trend.hba1c_trend)} rounded-md text-center`}>
                                    {trend.hba1c_trend}
                                  </TableCell>
                                  <TableCell className={`${getTrendColor(trend.bmi_trend)} rounded-md text-center`}>
                                    {trend.bmi_trend}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      ))} */}
                  </div> 
                </div>
              </Card>
            )}

            {/* Profile Info Tab */}
            {activeTab === "profile-info" && (
              <Card className="p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-6 text-blue-700 border-b pb-2">{t('userProfile.personalInformation')}</h2>
                <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-10">
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.age')}:</span>
                    <span>{client.ClientInfo.Age || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.race')}:</span>
                    <span>{client.ClientInfo.Race || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.gender')}:</span>
                    <span>{client.ClientInfo.Gender || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.state')}:</span>

                    <span>{client.ClientInfo.State || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.nationality')}:</span>
                    <span>{client.Nationality || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.email')}:</span>
                    <span>{client.ClientInfo.Email || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.phone')}:</span>
                    <span>{client.ClientInfo.Phone || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.provider')}:</span>
                    <span>{client.ClientInfo.Provider || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.product')}:</span>
                    <span>{client.ClientInfo.Product || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.miaHealthScore')}:</span>
                    <span>{client.ClientInfo.MiaHealthScore || t('userProfile.messages.na')}</span>
                  </div>
                </div>

                <h2 className="text-xl font-semibold mb-6 text-blue-700 border-b pb-2">{t('userProfile.sections.basicInformation')}</h2>
                <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-10">
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.height')}:</span>
                    <span>{client.ClientInfo.Height || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.sleepScore')}:</span>
                    <span>{client.ClientInfo.SleepScore || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.weight')}:</span>
                    <span>{client.ClientInfo.Weight || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.sleepQuality')}:</span>
                    <span>{client.ClientInfo.SleepQuality || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.waist')}:</span>
                    <span>{client.ClientInfo.Waist || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.phq9Score')}:</span>
                    <span>{client.ClientInfo.PHQ9Score || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.bmiStatus')}:</span>
                    <span>{client.ClientInfo.BMIStatus || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.devices')}:</span>
                    <span>{client.ClientInfo.Devices || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.active')}:</span>
                    <span>{client.ClientInfo.Active || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.lmp')}:</span>
                    <span>{client.ClientInfo.LMP || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.activityLevel')}:</span>
                    <span>{client.ClientInfo.ActivityLevel || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.pregnant')}:</span>
                    <span>{client.ClientInfo.Pregnant || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.smoker')}:</span>
                    <span>{client.ClientInfo.Smoker || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.pregnancyAge')}:</span>
                    <span>{client.ClientInfo.PregnancyAge || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">{t('userProfile.fields.currentMedication')}:</span>
                    <span>{client.ClientInfo.CurrentMedication || t('userProfile.messages.na')}</span>
                  </div>
                </div>

                <h2 className="text-xl font-semibold mb-6 text-blue-700 border-b pb-2">{t('userProfile.sections.medicalInformation')}</h2>
                <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-10">
                  <div className="flex">
                    <span className="font-medium w-36">{t('userProfile.fields.medicalConditions')}:</span>
                    <span>{client.ClientInfo.MedicalConditions || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-36">{t('userProfile.fields.medicalHistory')}:</span>
                    <span>{client.ClientInfo.MedicalHistory || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-36">{t('userProfile.fields.suspectedMedicalConditions')}:</span>
                    <span>{client.ClientInfo.SuspectedMedicalConditions || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-36">{t('userProfile.fields.familyHistory')}:</span>
                    <span>{client.ClientInfo.FamilyHistory || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-36">{t('userProfile.fields.currentSymptoms')}:</span>
                    <span>{client.ClientInfo.HealthConcern || t('userProfile.messages.na')}</span>
                  </div>
                </div>

                <h2 className="text-xl font-semibold mb-6 text-blue-700 border-b pb-2">{t('userProfile.sections.riskAssessments')}</h2>
                <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                  <div className="flex">
                    <span className="font-medium w-36">{t('userProfile.fields.diabetes')}:</span>
                    <span>{client.ClientInfo.Diabetes || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-36">{t('userProfile.fields.pregnancyComplications')}:</span>
                    <span>{client.ClientInfo.PregnancyComplications || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-36">{t('userProfile.fields.hypertension')}:</span>
                    <span>{client.ClientInfo.Hypertension || t('userProfile.messages.na')}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-36">{t('userProfile.fields.mentalHealth')}:</span>
                    <span>{client.ClientInfo.MentalHealth || t('userProfile.messages.na')}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Sleep Summary Tab */}
            {activeTab === "sleep-summary" && (
              <Card className="p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-6 text-blue-700">{t('userProfile.sections.sleepSummary')}</h2>
                <div className="flex justify-end items-center mb-6 space-x-2">
                  <Button variant="outline" size="sm" className="text-blue-600 hover:bg-blue-50">
                    {t('userProfile.buttons.lastNight')}
                  </Button>
                  <Button variant="outline" size="sm" className="text-blue-600 hover:bg-blue-50">
                    {t('userProfile.buttons.last7Days')}
                  </Button>
                  <Button variant="outline" size="sm" className="text-blue-600 hover:bg-blue-50">
                    {t('userProfile.buttons.last15Days')}
                  </Button>
                  <div className="relative">
                    <Input type="text" placeholder={t('userProfile.buttons.selectDate')} className="pl-10" />
                    <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <p>{t('userProfile.messages.selectDateRange')}</p>
                </div>
              </Card>
            )}

            {/* Biometric History Tab */}
            {activeTab === "biometric-history" && (
              <Card className="p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-6 text-blue-700">{t('userProfile.sections.biometricHistory')}</h2>
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <p>{t('userProfile.messages.biometricHistoryPlaceholder')}</p>
                </div>
              </Card>
            )}

            {/* Assessments Tab */}
            {activeTab === "assessments" && (
              <Card className="p-6 shadow-sm">
                <div className="grid grid-cols-2 gap-12">
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-blue-700">{t('userProfile.sections.assessments')}:</h2>
                    {assessments.length > 0 ? (
                      <ul className="space-y-2">
                        {assessments.map((assessment) => (
                          <li key={assessment.id}>
                            <a href={assessment.assessment_url} className="text-blue-600 hover:text-blue-700 hover:underline">
                              {assessment.assessment_type}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">{t('userProfile.messages.noAssessments')}</p>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-blue-700">{t('userProfile.sections.assessmentHistory')}:</h2>
                    <a href="#" className="text-blue-600 hover:text-blue-700 hover:underline">
                      {t('userProfile.messages.allAssessmentHistory')}
                    </a>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
