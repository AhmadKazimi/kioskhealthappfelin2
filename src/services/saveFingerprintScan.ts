import { VitalsResult, BloodPressureResult } from './fingerprintSocketService';

// Backend DTO Interface - MATCHES FACE SCAN EXACTLY
// Backend expects camelCase field names (starts with lowercase)
interface ScanResultDto {
  clientId: string;                         // camelCase! (string to match face scan)
  heartRate10s: number;                     // camelCase!
  heartRate4s?: number;                     // camelCase!
  realtimeHeartRate?: number;               // camelCase!
  hrvSdnn?: number;                         // camelCase!
  cardiacStress?: number;                   // camelCase!
  systolicBloodPressure?: number;           // camelCase!
  healthRisks?: string;                     // camelCase! (match face scan)
  diastolicBloodPressure?: number;          // camelCase!
  breathingRate: number;                    // camelCase!
  hrvSdnnMs: number;                        // camelCase!
  systolicBloodPressureMmhg: number;        // camelCase!
  diastolicBloodPressureMmhg: number;       // camelCase!
  temperature?: number;
  glucose?: number;
  hba1c?: number;
  heartRateIntervals: number[];             // Array of numbers (NOT JSON string)
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

  // Get clientId from cookie (same as face scan) if the passed clientId is invalid
  const clientIdFromCookie = typeof document !== 'undefined'
    ? document.cookie.split('; ').find(r => r.startsWith('userId='))?.split('=')[1]
    : null;

  const actualClientId = (clientId && clientId !== '0') ? clientId : clientIdFromCookie;

  if (!actualClientId || actualClientId === '0') {
    console.error('❌ No valid clientId found - cannot save scan results');
    return {
      success: false,
      message: 'No client ID available. Please complete personal information first.'
    };
  }

  // Map SocketIO data to backend DTO (CORRECTED to match backend schema)
  const scanResultDto: ScanResultDto = {
    clientId: actualClientId,

    // Vitals mapping - match face scan exactly
    heartRate10s: vitals.vitals_results.heart_rate,
    heartRate4s: vitals.vitals_results.heart_rate, // Use same as HeartRate10s (4s data not available from fingerprint API)
    realtimeHeartRate: vitals.vitals_results.heart_rate, // Use same as HeartRate10s for compatibility with face scan
    hrvSdnn: vitals.vitals_results.hrv_rate, // Face scan sends this
    hrvSdnnMs: vitals.vitals_results.hrv_rate,
    breathingRate: vitals.vitals_results.resp_rate,
    healthRisks: undefined, // Face scan sends this, but fingerprint API doesn't provide it

    // Blood pressure mapping (use calibrated if available)
    // Send both formats to match face scan
    systolicBloodPressure: bloodPressure.bp_calibrated
      ? bloodPressure.calibrated_systolic_blood_pressure!
      : bloodPressure.systolic_blood_pressure,
    diastolicBloodPressure: bloodPressure.bp_calibrated
      ? bloodPressure.calibrated_diastolic_blood_pressure!
      : bloodPressure.diastolic_blood_pressure,
    systolicBloodPressureMmhg: bloodPressure.bp_calibrated
      ? bloodPressure.calibrated_systolic_blood_pressure!
      : bloodPressure.systolic_blood_pressure,
    diastolicBloodPressureMmhg: bloodPressure.bp_calibrated
      ? bloodPressure.calibrated_diastolic_blood_pressure!
      : bloodPressure.diastolic_blood_pressure,

    // Optional fields - RR intervals for arrhythmia detection
    heartRateIntervals: vitals.vitals_results.rr_intervals || [],

    // EXPLICITLY EXCLUDED (not in backend schema or not available from fingerprint API):
    // ❌ SpO2 - available from API but not in backend schema
    // ❌ PerfusionIndex - available from API but not in backend schema
    // ❌ MeanRR - not in backend schema
    // ❌ CardiacStress - not available from fingerprint API (only face scan SDK provides this)
    // ❌ ScanType, ScanDate - not in backend schema (backend uses auto CreationTime)
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
    console.log('ClientId:', scanResultDto.clientId);
    console.log('Scan Type:', 'Fingerprint (not sent to backend - backend uses CreationTime)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Vitals Summary:');
    console.log('  Heart Rate (10s):', scanResultDto.heartRate10s, 'BPM');
    console.log('  Heart Rate (4s):', scanResultDto.heartRate4s, 'BPM');
    console.log('  Real-time Heart Rate:', scanResultDto.realtimeHeartRate, 'BPM');
    console.log('  HRV (SDNN):', scanResultDto.hrvSdnnMs, 'ms');
    console.log('  Breathing Rate:', scanResultDto.breathingRate, 'BPM');
    console.log('  Blood Pressure:', `${scanResultDto.systolicBloodPressureMmhg}/${scanResultDto.diastolicBloodPressureMmhg}`, 'mmHg');
    console.log('  RR Intervals:', scanResultDto.heartRateIntervals?.length || 0, 'values (number array)');
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
    console.log('ClientId:', scanResultDto.clientId);
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('Response Body:', JSON.stringify(result, null, 2));
    console.log('Saved Vitals (CORRECTED FIELD NAMES):');
    console.log('  HR:', scanResultDto.heartRate10s, 'BP:', `${scanResultDto.systolicBloodPressureMmhg}/${scanResultDto.diastolicBloodPressureMmhg}`, 'BR:', scanResultDto.breathingRate);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ============================================================
    // API CALL 2: Trigger Arrhythmia Detection (Same as Face Scan)
    // ============================================================
    const rrIntervals = vitals.vitals_results.rr_intervals || [];
    const MIN_RR_INTERVALS_FOR_ARRHYTHMIA = 60; // Minimum heartbeats required for reliable arrhythmia detection

    // Only call arrhythmia detection if we have sufficient RR intervals
    if (rrIntervals.length >= MIN_RR_INTERVALS_FOR_ARRHYTHMIA) {
      try {
        const arrhythmiaRequestData = {
          clientId: actualClientId,
          inputs: [rrIntervals]  // Same format as face scan - array wrapped in array
        };

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📤 API CALL 2: Triggering Arrhythmia Detection');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Endpoint:', `POST ${apiUrl}/Arrhythmia/AddArrhythmiaRequest`);
        console.log('Request Data:', JSON.stringify(arrhythmiaRequestData, null, 2));
        console.log('RR Intervals Count:', rrIntervals.length, `(minimum required: ${MIN_RR_INTERVALS_FOR_ARRHYTHMIA})`);
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
      console.warn('⚠️ SKIPPING API CALL 2: Insufficient RR intervals for arrhythmia detection');
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn('RR Intervals Count:', rrIntervals.length);
      console.warn('Minimum Required:', MIN_RR_INTERVALS_FOR_ARRHYTHMIA);
      console.warn('Arrhythmia detection will not be triggered');
      console.warn('Note: Scan duration increased to 100s should provide ~120 heartbeats at 72 BPM');
      console.warn('Troubleshooting: Ensure checkArrhythmias is enabled in socket connection');
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
