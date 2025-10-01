import { VitalsResult, BloodPressureResult } from './fingerprintSocketService';

// Backend DTO Interface (matches backend structure)
interface ScanResultDto {
  ClientId: string;
  HeartRate10s: number;
  HrvSdnnMs: number;
  BreathingRate: number;
  SystolicBloodPressureMmhg: number;
  DiastolicBloodPressureMmhg: number;
  SpO2: number;                    // NEW
  PerfusionIndex: number;          // NEW
  MeanRR: number;                  // NEW
  ScanType: 'Face' | 'Fingerprint'; // NEW
  ScanDate: string; // ISO format
}

/**
 * Data Mapping Table:
 *
 * SocketIO Field               → Backend Field
 * --------------------------------|---------------------------------
 * heart_rate                   → HeartRate10s
 * hrv_rate                     → HrvSdnnMs
 * resp_rate                    → BreathingRate
 * systolic_blood_pressure      → SystolicBloodPressureMmhg
 * diastolic_blood_pressure     → DiastolicBloodPressureMmhg
 * spo2_rate                    → SpO2 (NEW)
 * perfusion_index              → PerfusionIndex (NEW)
 * mean_rr                      → MeanRR (NEW)
 * 'Fingerprint' (hardcoded)    → ScanType (NEW)
 */

export async function saveFingerprintScan(
  clientId: string,
  vitals: VitalsResult,
  bloodPressure: BloodPressureResult
): Promise<{ success: boolean; message: string }> {

  // Map SocketIO data to backend DTO
  const scanResultDto: ScanResultDto = {
    ClientId: clientId,

    // Vitals mapping
    HeartRate10s: vitals.vitals_results.heart_rate,
    HrvSdnnMs: vitals.vitals_results.hrv_rate,
    BreathingRate: vitals.vitals_results.resp_rate,

    // Blood pressure mapping (use calibrated if available)
    SystolicBloodPressureMmhg: bloodPressure.bp_calibrated
      ? bloodPressure.calibrated_systolic_blood_pressure!
      : bloodPressure.systolic_blood_pressure,
    DiastolicBloodPressureMmhg: bloodPressure.bp_calibrated
      ? bloodPressure.calibrated_diastolic_blood_pressure!
      : bloodPressure.diastolic_blood_pressure,

    // New fingerprint-specific fields
    SpO2: vitals.vitals_results.spo2_rate,
    PerfusionIndex: vitals.vitals_results.perfusion_index,
    MeanRR: vitals.vitals_results.mean_rr,

    // Scan type identifier
    ScanType: 'Fingerprint',

    // Timestamp
    ScanDate: new Date().toISOString()
  };

  try {
    // Get backend URL from environment
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://your-backend-url.com/api';

    const response = await fetch(`${apiUrl}/ScanResult/AddScanResult`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true', // If using ngrok for dev
      },
      body: JSON.stringify(scanResultDto)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    return {
      success: true,
      message: 'Scan result saved successfully'
    };

  } catch (error) {
    console.error('Failed to save fingerprint scan:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
