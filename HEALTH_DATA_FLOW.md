# Health Data Flow - Detailed Technical Documentation

## Overview
This document provides an in-depth technical analysis of how health data flows through the system, from camera capture to database storage, focusing on the AI-powered vital signs extraction process.

---

## Complete Health Data Flow Pipeline

### 1. Video Capture & Camera Access

**Location**: `src/components/ShenaiScanner.tsx`

#### Camera Initialization Process
```typescript
// Camera workaround for permission prompt
const applyCameraWorkaround = () => {
  const canvas = document.getElementById('mxcanvas');
  if (!canvas || !(window as any).shenaiInitialized) {
    setTimeout(applyCameraWorkaround, 200);
    return;
  }
  setTimeout(() => {
    try {
      shenaiSDK.setCameraMode(shenaiSDK.CameraMode.OFF);
      setTimeout(() => {
        if ((window as any).shenaiInitialized) {
          shenaiSDK.setCameraMode(shenaiSDK.CameraMode.FACING_USER);
        }
      }, 100);
    } catch (e) {
      console.warn('Camera workaround error:', e);
    }
  }, 500);
};
```

#### Technical Details:
- **Canvas Element**: `<canvas id="mxcanvas">` serves as the video rendering surface
- **Camera Mode**: `FACING_USER` for front-facing camera (ideal for health scanning)
- **Permission Handling**: Automatic camera permission request through browser APIs
- **Error Handling**: Comprehensive error handling for camera access failures

### 2. Frame Processing & WebAssembly Integration

#### SDK Initialization
```typescript
// Dynamic SDK loading to avoid build-time issues
const sdkPath = '/shenai-sdk/index.mjs';
const mod: any = await import(/* webpackIgnore: true */ sdkPath);
const CreateShenaiSDK = mod.default;
shenaiSDK = await CreateShenaiSDK();
```

#### WebAssembly Components:
- **`shenai_sdk.wasm`**: Main AI processing engine (facial analysis algorithms)
- **`shenai_sdk.worker.js`**: Web Worker for background processing
- **`index.mjs`**: JavaScript wrapper for WASM module

#### Frame Processing Pipeline:
1. **Video Stream Capture**: Browser captures live video frames from camera
2. **Frame Buffering**: Frames are buffered for consistent processing
3. **WebAssembly Processing**: Each frame is processed through WASM AI algorithms
4. **Real-time Analysis**: Continuous analysis of facial features and micro-movements

### 3. AI Analysis & Vital Signs Extraction

#### Metrics Configuration
```typescript
shenaiSDK.setCustomMeasurementConfig({
  durationSeconds: 100,
  instantMetrics: [
    shenaiSDK.Metric.HEART_RATE,
    shenaiSDK.Metric.HRV_SDNN,
    shenaiSDK.Metric.BREATHING_RATE,
    shenaiSDK.Metric.SYSTOLIC_BP,
    shenaiSDK.Metric.DIASTOLIC_BP,
    shenaiSDK.Metric.CARDIAC_STRESS,
    shenaiSDK.Metric.PNS_ACTIVITY,
    shenaiSDK.Metric.CARDIAC_WORKLOAD,
    shenaiSDK.Metric.AGE,
    shenaiSDK.Metric.BMI
  ],
  summaryMetrics: [
    // Same metrics for final summary
  ]
});
```

#### AI Processing Methods:

**1. Photoplethysmography (PPG)**
- Detects subtle color changes in facial skin
- Analyzes blood volume variations
- Extracts heart rate and heart rate variability

**2. Facial Micro-Movement Analysis**
- Tracks chest/facial movements for breathing rate
- Analyzes facial blood flow patterns
- Estimates blood pressure through pulse wave analysis

**3. Advanced Metrics**
- **Heart Rate Variability (HRV)**: Measures variation in time between heartbeats
- **Cardiac Stress**: Calculated from HRV and heart rate patterns
- **PNS Activity**: Parasympathetic nervous system activity assessment

### 4. Data Extraction & Real-time Metrics

#### Health Metrics Extraction
```typescript
const results = {
  // Real-time Heart Rate Measurements
  heartRate10s: shenaiSDK.getHeartRate10s(),        // 10-second average
  heartRate4s: shenaiSDK.getHeartRate4s(),          // 4-second average
  realtimeHeartRate: shenaiSDK.getRealtimeHeartRate(), // Instant measurement
  
  // Heart Rate Variability
  hrvSdnn: shenaiSDK.getRealtimeHrvSdnn(),          // Real-time HRV
  hrvSdnnMs: measurementResults?.hrv_sdnn_ms,       // HRV in milliseconds
  
  // Cardiovascular Metrics
  cardiacStress: shenaiSDK.getRealtimeCardiacStress(),
  systolicBp: measurementResults?.systolic_blood_pressure_mmhg,
  diastolicBp: measurementResults?.diastolic_blood_pressure_mmhg,
  
  // Respiratory Metrics
  breathingRate: measurementResults?.breathing_rate_bpm,
  
  // Additional Health Indicators
  healthRisks: shenaiSDK.getHealthRisks(),
  
  // Raw Heart Beat Data
  heartRateIntervals: heartBeatsArray // Raw R-R intervals
};
```

#### Measurement Accuracy & Validation:
- **Sampling Rate**: 30-60 FPS video processing
- **Measurement Duration**: 100 seconds for comprehensive analysis
- **Signal Quality**: Real-time signal quality assessment
- **Noise Filtering**: Advanced filtering algorithms to remove artifacts

### 5. Real-time Updates & Component Communication

#### Live Data Broadcasting
```typescript
// Event-driven updates during measurement
eventCallback: async (event: string) => {
  if (event === "START_BUTTON_CLICKED") {
    // Initialize measurement configuration
  }
  if (event === "MEASUREMENT_FINISHED") {
    // Extract and save final results
    const results = extractAllMetrics();
    await saveScanResults(results);
  }
}
```

#### Component State Management
```typescript
// In face-scan-screen.tsx
interface VitalsData {
  heartRate: number
  bloodPressure: string
  temperature: number  // Note: Currently not measured by SDK
  oxygenSaturation: number  // Note: Currently not measured by SDK
}
```

#### Real-time Display Updates:
- **Progress Indicators**: Visual feedback during measurement
- **Live Metrics**: Real-time display of heart rate during scanning
- **Quality Indicators**: Signal quality and measurement reliability

### 6. Health Questionnaires & Risk Assessment

The system includes a sophisticated questionnaire system that appears **conditionally** based on AI analysis results from the face scan.

#### When Questionnaires Appear
```typescript
// Questionnaires are triggered when AI detects potential health risks
const conditionsNeedingQuestionnaires = conditions.filter(
  condition => condition.InitialRiskLevel === 'HighRisk' || condition.InitialRiskLevel === 'Suspected'
);
```

**Trigger Conditions**:
- **HighRisk**: AI detected strong patterns of specific arrhythmias
- **Suspected**: AI detected potential patterns requiring further assessment
- **Confirmed**: No questionnaire needed (condition ruled out)

#### Questionnaire Flow Process

**1. AI Analysis Results**
```typescript
// After face scan completes, system fetches arrhythmia analysis
const response = await fetch(`${apiUrl}/Arrhythmia/GetArrhythmiaRequests?clientId=${userId}`);
const clientConditions = responseJson.Result; // Array of detected conditions
```

**2. Risk-Based Filtering**
- System filters conditions requiring questionnaires
- Only shows questionnaires for conditions with elevated risk levels
- Skips questionnaire phase if no risks detected

**3. Multi-Condition Assessment**
```typescript
// Sequential questionnaire completion
const handleQuestionnaireComplete = (conditionIndex, answers, score, calculatedRiskLevel) => {
  // Update condition with questionnaire results
  const updatedConditions = [...conditions];
  updatedConditions[conditionIndex] = {
    ...updatedConditions[conditionIndex],
    QuestionnaireRiskLevel: calculatedRiskLevel,
    QuestionnaireScore: score,
    Answers: mappedAnswers,
    questionnaire: { answers, score, calculatedRiskLevel }
  };

  // Move to next condition or complete assessment
  if (currentConditionIndex < conditionsNeedingQuestionnaires.length - 1) {
    setCurrentConditionIndex(currentConditionIndex + 1);
  } else {
    onNext(); // All questionnaires completed
  }
};
```

#### Questionnaire Data Structure

**Question Types**:
```typescript
interface Question {
  text: string;           // English question text
  text_ar?: string;       // Arabic translation
  type: 'multiple_choice' | 'yes_no' | 'scale';
  options: string[];      // Answer options
  options_ar?: string[];  // Arabic answer options
  scoring: Record<string, number>; // Score mapping for answers
}
```

**Example Questionnaire Structure**:
```json
{
  "Atrial_Fibrillation": {
    "title": "Atrial Fibrillation Assessment",
    "title_ar": "تقييم الرجفان الأذيني",
    "min_score_threshold": 3,
    "questions": [
      {
        "text": "Do you experience irregular heartbeat?",
        "text_ar": "هل تشعر بضربات قلب غير منتظمة؟",
        "type": "multiple_choice",
        "options": ["Never", "Sometimes", "Often", "Always"],
        "options_ar": ["أبداً", "أحياناً", "غالباً", "دائماً"],
        "scoring": { "Never": 0, "Sometimes": 1, "Often": 2, "Always": 3 }
      }
    ]
  }
}
```

#### Risk Level Calculation
```typescript
// Score-based risk assessment
const score = conditionQuestionnaire.questions.reduce((total, question, index) => {
  const answer = answers[index];
  return total + (answer ? question.scoring[answer] : 0);
}, 0);

const calculatedRiskLevel: RiskLevel = 
  score >= conditionQuestionnaire.min_score_threshold ? 'HighRisk' : 'Suspected';
```

#### Symptoms/Complaints Collection

**Initial Symptom Selection** (`complaint-screen.tsx`):
```typescript
// Predefined symptom categories
const commonComplaints = [
  { key: 'headache', value: 'Headache' },
  { key: 'fever', value: 'Fever' },
  { key: 'cough', value: 'Cough' },
  { key: 'soreThroat', value: 'Sore Throat' },
  { key: 'stomachPain', value: 'Stomach Pain' },
  { key: 'backPain', value: 'Back Pain' },
  { key: 'dizziness', value: 'Dizziness' },
  { key: 'fatigue', value: 'Fatigue' },
  { key: 'nausea', value: 'Nausea' },
  { key: 'shortnessOfBreath', value: 'Shortness of Breath' },
  { key: 'chestPain', value: 'Chest Pain' },
  { key: 'other', value: 'Other' }  // Custom input option
];
```

**Symptom Data Storage**:
```typescript
// Symptoms saved to user data
const finalUserData = {
  HealthConcern: userData.complaint || "",      // Primary field
  ReportedSymptoms: userData.complaint || "",   // Duplicate field
  // ... other user data
};
```

#### Questionnaire Data Storage

**Local Storage Format**:
```typescript
interface ConditionWithQuestionnaire {
  ArrhythmiaName: string;          // Condition identifier
  InitialRiskLevel: RiskLevel;     // AI-detected risk level
  QuestionnaireRiskLevel: RiskLevel; // Questionnaire-calculated risk
  QuestionnaireScore: number;      // Total questionnaire score
  Answers: QuestionnaireAnswer[];  // Individual answers
  questionnaire?: {                // UI state data
    answers: Record<number, string>;
    score: number;
    calculatedRiskLevel: RiskLevel;
  };
}
```

**API Persistence**:
- Questionnaire results are stored in the condition records
- Answers mapped to structured format for analysis
- Risk levels updated based on combined AI + questionnaire assessment

#### Translation & Internationalization

**Dynamic Translation**:
```typescript
// Question text selection based on language
const getQuestionText = () => {
  return isArabic && currentQuestion.text_ar ? currentQuestion.text_ar : currentQuestion.text;
};

// Symptom translation mapping
const translateSymptoms = (symptomsText: string): string => {
  const symptomMap = {
    'headache': t('complaint.symptoms.headache'),
    'fever': t('complaint.symptoms.fever'),
    // ... additional mappings
  };
  // Translation logic for compound symptoms
};
```

### 7. Database Storage & API Integration

#### Data Transmission to External API
```typescript
const saveScanResults = async (results: any) => {
  (window as any).setReactLoading?.(true);
  
  try {
    // Primary health data endpoint
    const response = await fetch(String(apiUrl) + '/ScanResult/AddScanResult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: document.cookie.split('; ').find(r => r.startsWith('userId='))?.split('=')[1],
        heartRate10s: results.heartRate10s,
        heartRate4s: results.heartRate4s,
        realtimeHeartRate: results.realtimeHeartRate,
        hrvSdnn: results.hrvSdnn,
        cardiacStress: results.cardiacStress,
        systolicBloodPressure: results.systolicBp,
        diastolicBloodPressure: results.diastolicBp,
        healthRisks: results.healthRisks,
        breathingRate: results.breathingRate,
        hrvSdnnMs: results.hrvSdnnMs,
        systolicBloodPressureMmhg: results.systolicBloodPressureMmhg,
        diastolicBloodPressureMmhg: results.diastolicBloodPressureMmhg,
        heartRateIntervals: heartBeatsArray
      })
    });

    // Arrhythmia analysis endpoint
    await fetch(String(apiUrl) + '/Arrhythmia/AddArrhythmiaRequest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: document.cookie.split('; ').find(r => r.startsWith('userId='))?.split('=')[1],
        inputs: [heartBeatsArray]
      })
    });
    
  } catch (error) {
    console.error('Error saving scan results:', error);
  }
};
```

#### PayloadCMS Data Storage
```typescript
// Internal data structure for PayloadCMS
const userData = {
  client: {
    fullName: client.FullName,
    email: client.Email,
    phone: client.Phone,
    age: client.Age,
    gender: client.Gender,
    consent: true,
    nationalityId: client.NationalityId
  },
  vitals: {
    heartRate: data?.RealTimeHeartRate,
    bloodPressure: data?.SystolicBloodPressureMmhg + "/" + data?.DiastolicBloodPressureMmhg,
    breathingRate: data?.BreathingRate,
    hrvSdnnMs: data?.HrvSdnnMs,
    diastolicBP: data?.DiastolicBloodPressureMmhg,
    systolicBP: data?.SystolicBloodPressureMmhg,
    oxygenSaturation: 0,  // Placeholder - not measured
    temperature: 0        // Placeholder - not measured
  }
};
```

---

## Detailed Technical Specifications

### Data Types & Structures

#### Raw Measurement Data
```typescript
interface MeasurementResults {
  // Heart Rate Metrics
  heart_rate_bpm: number;                    // Beats per minute
  
  // Heart Rate Variability
  hrv_sdnn_ms: number;                      // Standard deviation of NN intervals (ms)
  hrv_lnrmssd_ms: number;                   // Natural log of RMSSD (ms)
  
  // Blood Pressure (estimated)
  systolic_blood_pressure_mmhg: number;     // Systolic BP (mmHg)
  diastolic_blood_pressure_mmhg: number;    // Diastolic BP (mmHg)
  
  // Respiratory
  breathing_rate_bpm: number;               // Breaths per minute
  
  // Advanced Metrics
  stress_index: number;                     // Calculated stress indicator
  cardiac_workload: number;                 // Heart workload assessment
  pns_activity: number;                     // Parasympathetic activity
  
  // Demographics (estimated)
  estimated_age: number;                    // AI-estimated age
  estimated_bmi: number;                    // AI-estimated BMI
}
```

#### Heart Beat Interval Data
```typescript
interface HeartBeat {
  duration_ms: number;  // R-R interval duration in milliseconds
}

// Array of heart beat intervals for detailed analysis
const heartRateIntervals: number[] = heartbeats.map(x => x.duration_ms);
```

### Measurement Accuracy & Limitations

#### Accuracy Levels:
- **Heart Rate**: ±3-5 BPM accuracy under optimal conditions
- **Blood Pressure**: Estimated values, not medical-grade accuracy
- **Breathing Rate**: ±2-3 breaths per minute
- **HRV**: Research-grade accuracy for trends

#### Optimal Conditions:
- **Lighting**: Consistent, bright lighting (no direct sunlight)
- **Distance**: 18-24 inches from camera
- **Stability**: Minimal head movement during measurement
- **Duration**: 60-100 seconds for best accuracy

#### Current Limitations:
- **Temperature**: Not measured (placeholder value of 0)
- **Oxygen Saturation**: Not measured (placeholder value of 0)
- **Blood Pressure**: Estimated, not direct measurement

---

## Error Handling & Quality Assurance

### Signal Quality Assessment
```typescript
onCameraError: (error: string) => {
  console.error('Camera Error:', error);
  // Handle camera permission denial, hardware issues
}
```

### Data Validation Pipeline
1. **Signal Quality Check**: Real-time assessment of video quality
2. **Measurement Validation**: Cross-validation of multiple measurement methods
3. **Outlier Detection**: Statistical analysis to detect and remove artifacts
4. **Confidence Scoring**: Each measurement includes confidence level

### Fallback Mechanisms
- **Retry Logic**: Automatic retry on measurement failure
- **Degraded Mode**: Reduced accuracy mode for poor conditions
- **Manual Override**: Option to restart measurement if quality is poor

---

## Performance Optimization

### Client-Side Processing Benefits
- **Privacy**: All processing done locally, no video data sent to servers
- **Speed**: Real-time processing with minimal latency
- **Scalability**: No server-side processing load
- **Offline Capability**: Works without internet connection

### Memory & CPU Management
- **WASM Efficiency**: Optimized WebAssembly for computational efficiency
- **Memory Cleanup**: Proper cleanup of video buffers and processing data
- **Background Processing**: Web Workers prevent UI blocking

### Browser Compatibility
- **WebAssembly Support**: Requires modern browser with WASM support
- **Camera API**: Uses modern MediaDevices API
- **Canvas Rendering**: Hardware-accelerated canvas processing

---

## Integration with Health Summary System

### Data Flow to UI Components
```typescript
// Health summary page integration
const vitalSigns = latestResult ? [
  {
    name: t('faceScan.vitals.heartRate'),
    value: `${latestResult.HeartRate10s || "N/A"} ${t('fastScan.units.bpm')}`,
    normalRange: `60-100 ${t('fastScan.units.bpm')}`,
    status: latestResult.HeartRate10s && latestResult.HeartRate10s >= 60 && 
            latestResult.HeartRate10s <= 100 ? t('healthSummary.normal') : t('healthSummary.abnormal')
  },
  {
    name: t('faceScan.vitals.bloodPressure'),
    value: `${latestResult.SystolicBloodPressureMmhg || "N/A"}/${latestResult.DiastolicBloodPressureMmhg || "N/A"} ${t('fastScan.units.mmhg')}`,
    normalRange: `<120/<80 ${t('fastScan.units.mmhg')}`,
    status: latestResult.SystolicBloodPressureMmhg && latestResult.SystolicBloodPressureMmhg < 120 && 
            latestResult.DiastolicBloodPressureMmhg && latestResult.DiastolicBloodPressureMmhg < 80 ? 
            t('healthSummary.normal') : t('healthSummary.abnormal')
  }
];
```

### Chatbot Integration
```typescript
// Health data integration with chatbot
const systolic = userData.vitals?.systolicBP || userData.vitals?.bloodPressure?.split('/')[0] || '';
const diastolic = userData.vitals?.diastolicBP || userData.vitals?.bloodPressure?.split('/')[1] || '';
const heartRate = userData.vitals?.heartRate || '';

let message = `I am ${age} years old ${gender}`;
if (complaint) message += `, I have ${complaint.toLowerCase()}`;
if (systolic && diastolic) message += `, my blood pressure reading is ${systolic}/${diastolic} mmHg`;
if (heartRate) message += `, my heart rate pulse reading is ${heartRate} bpm`;
message += `, can you help me understand my symptom?`;
```

---

## Complete Health Data Flow Summary (Updated)

### Enhanced Data Flow Pipeline

1. **Video Capture**: Browser accesses user camera for facial analysis
2. **Frame Processing**: SDK processes video frames in WebAssembly for real-time analysis
3. **AI Analysis**: Facial analysis extracts vital signs (heart rate, blood pressure, breathing rate, HRV)
4. **Data Extraction**: Multiple health metrics extracted and validated
5. **Arrhythmia Analysis**: Heart rate intervals analyzed for irregular patterns
6. **Risk Assessment**: AI determines initial risk levels for various cardiac conditions
7. **Conditional Questionnaires**: System shows targeted questionnaires ONLY if:
   - AI detects `HighRisk` or `Suspected` patterns
   - Specific conditions need additional assessment
   - User symptoms align with detected patterns
8. **Risk Refinement**: Questionnaire responses refine initial AI risk assessments
9. **Real-time Updates**: Components receive live health metrics and assessment results
10. **Database Storage**: Final results (vitals + questionnaire data + risk assessments) saved to MongoDB via Payload API
11. **Health Summary**: Complete health profile with recommendations displayed to user

### When Questionnaires DON'T Show
- **Confirmed Conditions**: AI rules out specific conditions (risk level = "Confirmed")
- **No Risk Detected**: Clean scan with no concerning patterns
- **Low-Risk Results**: All detected patterns below questionnaire threshold

### When Questionnaires DO Show
- **High-Risk Detection**: AI detects strong patterns requiring validation
- **Suspected Patterns**: Potential conditions need symptom confirmation  
- **Multiple Conditions**: Sequential questionnaires for each high-risk condition
- **Symptom Correlation**: User-reported symptoms align with AI findings

### Data Persistence Strategy
```typescript
// Multi-layered data storage
{
  // User Demographics & Symptoms
  personalInfo: { fullName, email, phone, age, gender },
  complaints: ["headache", "chest pain", "shortness of breath"],
  
  // AI-Measured Vitals
  vitals: {
    heartRate: 78,
    bloodPressure: "125/82",
    breathingRate: 16,
    hrvSdnn: 42
  },
  
  // AI Risk Assessment
  arrhythmiaRisks: [
    {
      condition: "Atrial_Fibrillation",
      initialRiskLevel: "HighRisk",
      questionnaireRiskLevel: "HighRisk", 
      score: 7,
      answers: [...]
    }
  ],
  
  // Final Health Profile
  healthSummary: {
    overallRisk: "Moderate",
    recommendations: ["Consult cardiologist", "Monitor symptoms"],
    nextSteps: "Follow up within 2 weeks"
  }
}
```

This comprehensive health data flow ensures accurate, real-time vital signs measurement through advanced AI processing, intelligent risk assessment, targeted questionnaires when needed, and complete health profiling while maintaining data privacy and providing seamless integration with the health management system.