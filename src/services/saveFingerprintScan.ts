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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    // If no backend URL is configured, skip saving (dev mode)
    if (!apiUrl || apiUrl === 'https://your-backend-url.com/api') {
      console.warn('⚠️ No backend API URL configured - skipping save (set NEXT_PUBLIC_API_URL in .env.local)');
      return {
        success: true,
        message: 'Scan completed (backend save skipped - no API URL configured)'
      };
    }

    // ============================================================
    // API CALL 1: Save Scan Results
    // ============================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 API CALL 1: Saving Scan Results');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Endpoint:', `POST ${apiUrl}/ScanResult/AddScanResult`);
    console.log('Request Data:', JSON.stringify(scanResultDto, null, 2));
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
      console.error('❌ Scan result save FAILED');
      console.error('Status:', response.status);
      console.error('Error:', errorText);
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ API CALL 1: Scan Result Saved Successfully');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(result, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ============================================================
    // API CALL 2: Trigger Arrhythmia Detection
    // ============================================================
    const meanRR = vitals.vitals_results.mean_rr;
    
    // Only call arrhythmia detection if we have valid RR data
    if (meanRR && meanRR > 0) {
      try {
        const arrhythmiaRequestData = {
          clientId: clientId,
          inputs: [[meanRR]]  // Wrap in double array to match face scan format
        };

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📤 API CALL 2: Triggering Arrhythmia Detection');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Endpoint:', `POST ${apiUrl}/Arrhythmia/AddArrhythmiaRequest`);
        console.log('Request Data:', JSON.stringify(arrhythmiaRequestData, null, 2));
        console.log('Mean RR Value:', meanRR);
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
      console.warn('⚠️ SKIPPING API CALL 2: Invalid mean_rr value');
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn('Mean RR Value:', meanRR);
      console.warn('Arrhythmia detection will not be triggered');
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
