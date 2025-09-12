// Type definitions for data service (legacy Supabase types kept for compatibility)

export interface User {
  id: string
  name: string
  age?: string
  sex?: string
  race?: string
  region?: string
  state?: string
  provider?: string
  product?: string
  mia_health_score?: string
  height?: string
  weight?: string
  waist?: string
  bmi_status?: string
  active?: string
  activity_level?: string
  smoker?: string
  current_medication?: string
  sleep_score?: string
  sleep_quality?: string
  phq9_score?: string
  devices?: string
  lmp?: string
  pregnant?: string
  pregnancy_age?: string
  medical_conditions?: string
  suspected_conditions?: string
  current_symptoms?: string
  medical_history?: string
  family_history?: string
  diabetes?: string
  hypertension?: string
  pregnancy_complications?: string
  mental_health?: string
}

export interface HealthReading {
  id: string
  user_id: string
  blood_pressure: string
  spo2: number
  heart_rate: number
  respiration_rate: number
  temperature: number
  glucose: number
  hba1c: number
  bmi: number
  hrv: number
  reading_date: string
}

export interface HealthTrend {
  id: string
  user_id: string
  trend_type: string
  blood_pressure_avg: string
  spo2_avg: number
  heart_rate_avg: number
  respiration_rate_avg: number
  temperature_avg: number
  glucose_avg: number
  hba1c_avg: number
  bmi_avg: number
  blood_pressure_trend: string
  spo2_trend: string
  heart_rate_trend: string
  respiration_rate_trend: string
  temperature_trend: string
  glucose_trend: string
  hba1c_trend: string
  bmi_trend: string
  calculated_at: string
}

export interface Assessment {
  id: string
  user_id: string
  assessment_type: string
  assessment_url: string
  created_at: string
} 