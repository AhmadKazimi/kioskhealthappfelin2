export interface ClientProfile{
    ClientInfo: Client 
    Nationality: string, 
    
    LatestReadings: LatestReading[],
    ArrhythmiaRisks: ArrhythmiaRisk[],
    PossibleCauses: PossibleCause[],
}

interface Client{
    FullName: string,
    Age: string,
    Gender: string,
    Email: string,
    Phone: string,
    CurrentSymptoms?: string,
    SuggestedCare?: string
    HealthConcern?: string
    Race: string
    State: string
    Provider: string
    Product: string
    MiaHealthScore: string

    Height: string
    SleepScore: string
    Weight: string
    SleepQuality: string
    Waist: string
    PHQ9Score: string
    BMIStatus: string
    Devices : string
    Active : string
    LMP : string
    ActivityLevel : string
    Pregnant : string
    Smoker : string
    PregnancyAge : string
    CurrentMedication : string
    MedicalConditions : string
    MedicalHistory : string
    SuspectedMedicalConditions : string
    FamilyHistory : string 
    Diabetes : string
    PregnancyComplications : string
    Hypertension : string
    MentalHealth : string 
}

export interface LatestReading{
    Id: number,
    CreationTime: string,
    BloodPressure?: string,
    HeartRate?: string, 
    SPO2?: string,
    HeartRateVariability?: string,
    RespirationRate?: string,
    BmiScore?: string,
    Temperature: string,
    Glucose: string,
    Hba1c: string
}
 
interface PossibleCause{ 
    PossibleCause: string,
    Level: string
}

export interface ArrhythmiaRisk {
  Id: string
  user_id: string
  ArrhythmiaName: string
  Confidence: number
  Detected: boolean
  CreationTime: string
  LastModificationTime: string,
  InitialRiskLevel: string,
  QuestionnaireRiskLevel: string,
  QuestionnaireScore: number,
  Answers: QuestionnaireAnswer[]
}
 
interface QuestionnaireAnswer{
    ArrhythmiaResultId: number,
    Index: number,
    Answer: string
}