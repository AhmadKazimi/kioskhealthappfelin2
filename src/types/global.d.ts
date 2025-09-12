// Define proper types for scan results
interface ScanResults {
  realtimeHeartRate?: number;
  systolicBloodPressureMmhg?: number;
  diastolicBloodPressureMmhg?: number;
  breathingRate?: number;
  hrvSdnnMs?: number;
  hrvLnrmssdMs?: number;
  cardiacStress?: number;
  stressIndex?: number;
  parasympatheticActivity?: number;
  cardiacWorkload?: number;
  estimatedAge?: number;
  ageYears?: number;
  bmi?: number;
  bmiKgPerM2?: number;
  estimatedWeight?: number;
  weightKg?: number;
  estimatedHeight?: number;
  heightCm?: number;
  wellnessScore?: number;
  vascularAge?: number;
  waistToHeightRatio?: number;
  bodyFatPercentage?: number;
  basalMetabolicRate?: number;
  totalDailyEnergyExpenditure?: number;
  hypertensionRisk?: number;
  diabetesRisk?: number;
  averageSignalQuality?: number;
  badSignalDuration?: number;
  totalBadSignalSeconds?: number;
}

// Define ShenAI SDK interface
interface ShenAI {
  isInitialized(): boolean;
  setScreen(screen: unknown): void;
  deinitialize(): void;
  Screen: {
    MEASUREMENT: unknown;
  };
}

declare global {
  interface Window {
    shenai?: ShenAI;
    onFastScanComplete?: (results: ScanResults) => void;
    onFastScanError?: (error: string) => void;
    setReactLoading?: (loading: boolean) => void;
    fastScanSdkInitialized?: boolean;
    resetFastScanSdk?: () => void;
  }
}

export { type ScanResults, type ShenAI }; 