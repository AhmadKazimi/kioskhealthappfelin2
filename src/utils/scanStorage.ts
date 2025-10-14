/**
 * Storage utility for managing scan results in sessionStorage
 * SessionStorage clears when the browser tab is closed, perfect for temporary scan data
 */

export interface SDKMeasurementResults {
  // Core vitals
  heart_rate_bpm: number;
  hrv_sdnn_ms: number | null;
  hrv_lnrmssd_ms: number | null;
  breathing_rate_bpm: number | null;
  systolic_blood_pressure_mmhg: number | null;
  diastolic_blood_pressure_mmhg: number | null;

  // Advanced metrics
  stress_index: number | null;
  cardiac_workload_mmhg_per_sec: number | null;
  parasympathetic_activity: number | null;

  // Body metrics
  age_years: number | null;
  bmi_kg_per_m2: number | null;
  weight_kg: number | null;
  height_cm: number | null;

  // Quality metrics
  average_signal_quality: number | null;

  // Heartbeat data
  heartbeats: Array<{ duration_ms: number }>;

  // Health risks (from SDK)
  healthRisks?: any;
}

const STORAGE_KEY = 'latest_scan_results';

/**
 * Save scan results to sessionStorage
 */
export function saveScanResults(results: SDKMeasurementResults): void {
  try {
    const data = {
      results,
      timestamp: new Date().toISOString(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('✅ Saved scan results to sessionStorage:', results);
  } catch (error) {
    console.error('❌ Failed to save scan results to sessionStorage:', error);
  }
}

/**
 * Get latest scan results from sessionStorage
 */
export function getLatestScanResults(): SDKMeasurementResults | null {
  try {
    const data = sessionStorage.getItem(STORAGE_KEY);
    if (!data) {
      console.log('⚠️ No scan results found in sessionStorage');
      return null;
    }

    const parsed = JSON.parse(data);
    console.log('✅ Retrieved scan results from sessionStorage:', parsed.results);
    return parsed.results;
  } catch (error) {
    console.error('❌ Failed to retrieve scan results from sessionStorage:', error);
    return null;
  }
}

/**
 * Clear scan results from sessionStorage
 */
export function clearScanResults(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    console.log('✅ Cleared scan results from sessionStorage');
  } catch (error) {
    console.error('❌ Failed to clear scan results from sessionStorage:', error);
  }
}

/**
 * Check if scan results exist in sessionStorage
 */
export function hasScanResults(): boolean {
  return sessionStorage.getItem(STORAGE_KEY) !== null;
}
