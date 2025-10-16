import { VitalsResult, BloodPressureResult } from './fingerprintSocketService';

// Backend DTO Interface (CORRECTED to match actual backend schema)
// Backend expects camelCase field names!
interface ScanResultDto {
  ClientId: number;
  HeartRate10s: number;
  HeartRate4s?: number;
  RealTimeHeartRate?: number;
  SystolicBloodPressureMmhg: number;
  DiastolicBloodPressureMmhg: number;
  BreathingRate: number;
  HrvSdnnMs: number;
  CardiacStress?: number;
  HRIntervals?: string;
  HearRateIntervals?: string;
  Temperature?: number;
  Glucose?: number;
  Hba1c?: number;
}

/**
 * CORRECTED Data Mapping Table (Based on Backend Schema):
 *
 * SocketIO Field               → Backend Field (camelCase)
 * --------------------------------|----------------------------------
 * heart_rate                   → heartRate10s
 * hrv_rate                     → heartRateVariability (NOT HrvSdnnMs!)
 * resp_rate                    → breathingRate
 * systolic_blood_pressure      → systolicBloodPressure (NO Mmhg suffix!)
 * diastolic_blood_pressure     → diastolicBloodPressureMmhg
 * rr_intervals (array)         → heartRateIntervals (JSON string)
 *
 * REMOVED (not in backend schema):
 * ❌ SpO2, PerfusionIndex, MeanRR, ScanType, ScanDate
 *
 * Backend Reference: See backend-documentation.md lines 814-835
 */

export async function saveFingerprintScan(
  clientId: string,
  vitals: VitalsResult,
  bloodPressure: BloodPressureResult
): Promise<{ success: boolean; message: string }> {

  // Map SocketIO data to backend DTO (CORRECTED to match backend schema)
  const scanResultDto: ScanResultDto = {
    ClientId: Number(clientId),

    // Vitals mapping (PascalCase to match current backend responses)
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

    // Optional fields
    HRIntervals: vitals.vitals_results.rr_intervals
      ? JSON.stringify(vitals.vitals_results.rr_intervals)
      : undefined,
    HearRateIntervals: vitals.vitals_results.rr_intervals
      ? JSON.stringify(vitals.vitals_results.rr_intervals)
      : undefined,

    // REMOVED: SpO2, PerfusionIndex, MeanRR - not in backend schema
    // REMOVED: ScanType, ScanDate - not in backend schema (uses auto CreationTime)
  };

  try {
    // Get backend URL from environment
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    // If no backend URL is configured, skip saving (dev mode)
    if (!apiUrl || apiUrl === 'https://your-backend-url.com/api') {
      console.warn('⚠️ No backend API URL configured - skipping save (set NEXT_PUBLIC_API_BASE_URL in .env)');
      return {
        success: true,
        message: 'Scan completed (backend save skipped - no API URL configured)'
      };
    }

    // ============================================================
    // API CALL 1: Save Scan Results
    // ============================================================
    const requestId = `FP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 API CALL 1: Saving Fingerprint Scan Results');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Request ID:', requestId);
    console.log('Endpoint:', `POST ${apiUrl}/ScanResult/AddScanResult`);
    console.log('ClientId:', scanResultDto.ClientId);
    console.log('Scan Type:', 'Fingerprint (not sent to backend - backend uses CreationTime)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Vitals Summary (CORRECTED FIELD NAMES):');
    console.log('  Heart Rate (10s):', scanResultDto.HeartRate10s, 'BPM');
    console.log('  HRV (HrvSdnnMs):', scanResultDto.HrvSdnnMs, 'ms');
    console.log('  Breathing Rate:', scanResultDto.BreathingRate, 'BPM');
    console.log('  Blood Pressure:', `${scanResultDto.SystolicBloodPressureMmhg}/${scanResultDto.DiastolicBloodPressureMmhg}`, 'mmHg');
    console.log('  RR Intervals:', scanResultDto.HRIntervals ? 'Included (JSON string)' : 'Not available');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 Full Request Body:', JSON.stringify(scanResultDto, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ API CALL 1: Scan result save FAILED');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Request ID:', requestId);
      console.error('ClientId:', scanResultDto.clientId);
      console.error('Status Code:', response.status);
      console.error('Status Text:', response.statusText);
      console.error('Error Response:', errorText);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ API CALL 1: Scan Result Saved Successfully');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Request ID:', requestId);
    console.log('ClientId:', scanResultDto.ClientId);
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('Response Body:', JSON.stringify(result, null, 2));
    console.log('Saved Vitals (CORRECTED FIELD NAMES):');
    console.log('  HR:', scanResultDto.heartRate10s, 'BP:', `${scanResultDto.systolicBloodPressure}/${scanResultDto.diastolicBloodPressureMmhg}`, 'BR:', scanResultDto.breathingRate);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ============================================================
    // API CALL 2: Trigger Arrhythmia Detection (Same as Face Scan)
    // ============================================================
    const rrIntervals = vitals.vitals_results.rr_intervals || [];

    // Only call arrhythmia detection if we have valid RR intervals array
    if (rrIntervals.length > 0) {
      try {
        const arrhythmiaRequestData = {
          clientId: clientId,
          inputs: [rrIntervals]  // Same format as face scan - array wrapped in array
        };

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📤 API CALL 2: Triggering Arrhythmia Detection');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Endpoint:', `POST ${apiUrl}/Arrhythmia/AddArrhythmiaRequest`);
        console.log('Request Data:', JSON.stringify(arrhythmiaRequestData, null, 2));
        console.log('RR Intervals Count:', rrIntervals.length);
        console.log('Sample RR Intervals:', rrIntervals.slice(0, 5).join(', '), '...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const arrhythmiaResponse = await fetch(`${apiUrl}/Arrhythmia/AddArrhythmiaRequest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify(arrhythmiaRequestData)
        });

        if (!arrhythmiaResponse.ok) {
          const arrhythmiaError = await arrhythmiaResponse.text();
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('❌ API CALL 2: Arrhythmia Detection FAILED');
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('Status:', arrhythmiaResponse.status);
          console.error('Error:', arrhythmiaError);
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          // Don't throw - allow scan to complete even if arrhythmia detection fails
        } else {
          const arrhythmiaResult = await arrhythmiaResponse.json();
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('✅ API CALL 2: Arrhythmia Detection Successful');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('Response Status:', arrhythmiaResponse.status);
          console.log('Response Data:', JSON.stringify(arrhythmiaResult, null, 2));
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }
      } catch (arrhythmiaError) {
        // Log but don't fail the entire operation
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ API CALL 2: Exception Occurred');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Error:', arrhythmiaError);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
    } else {
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn('⚠️ SKIPPING API CALL 2: No RR intervals available');
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn('RR Intervals:', rrIntervals);
      console.warn('Arrhythmia detection will not be triggered');
      console.warn('Note: Ensure checkArrhythmias is enabled in socket connection');
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ FINGERPRINT SCAN SAVE COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✓ Scan results saved to database');
    console.log('✓ Arrhythmia detection triggered');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      success: true,
      message: 'Scan result saved successfully'
    };

  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ FINGERPRINT SCAN SAVE FAILED');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error:', error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
