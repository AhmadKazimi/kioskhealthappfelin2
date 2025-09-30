# Health Kiosk Application - Complete Data Flow Documentation

## Table of Contents
1. [Overview](#overview)
2. [Data Flow Diagram](#data-flow-diagram)
3. [Step-by-Step User Journey](#step-by-step-user-journey)
4. [API Endpoints Reference](#api-endpoints-reference)
5. [Arrhythmia Detection System](#arrhythmia-detection-system)
6. [Questionnaire System](#questionnaire-system)
7. [Risk Assessment Algorithm](#risk-assessment-algorithm)
8. [Data Storage Strategy](#data-storage-strategy)

---

## Overview

The Health Kiosk Application is a Next.js-based health screening system that uses AI-powered face scanning technology (Shenai SDK) to detect vital signs and potential cardiac arrhythmias. The application guides users through a multi-step process:

1. Personal information collection
2. Age and gender input
3. AI-powered face scanning (100 seconds)
4. Vital signs results display
5. Health symptoms/complaints collection
6. Condition-specific questionnaires (if AI detects arrhythmia patterns)
7. Final health assessment summary

**Key Technologies:**
- **Frontend**: Next.js 15, React 19, TypeScript
- **AI Scanning**: Shenai SDK (WebAssembly-based)
- **Backend**: RESTful API with MongoDB
- **Storage**: Cookies, localStorage, backend database

---

## Data Flow Diagram

```
User Input Flow:
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Personal Info                                            │
│ ├─ Name, Email, Phone, Nationality                              │
│ └─ API: POST /client/AddOrUpdateClient                          │
│    └─ Returns: userId (saved to cookie)                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Age & Gender                                             │
│ ├─ Age (number), Gender (Male/Female)                           │
│ └─ API: POST /client/EditClient                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Face Scanning (100 seconds)                             │
│ ├─ Shenai SDK captures:                                         │
│ │  • Heartbeat intervals (RR intervals)                         │
│ │  • Heart rate (10s, 4s, realtime)                             │
│ │  • HRV SDNN                                                    │
│ │  • Blood pressure (systolic/diastolic)                        │
│ │  • Breathing rate                                             │
│ │  • Cardiac stress index                                       │
│ │  • Health risk scores                                         │
│ └─ Two simultaneous API calls:                                  │
│    ├─ POST /ScanResult/AddScanResult (save vitals)              │
│    └─ POST /Arrhythmia/AddArrhythmiaRequest (AI detection)      │
│       └─ Sends: heartbeat intervals array                       │
│       └─ AI processes data asynchronously                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Scan Results Display                                     │
│ ├─ Shows: Heart rate, BP, breathing rate, stress, HRV           │
│ └─ API: GET /ScanResult/GetClientLatestScanResult               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Health Complaints/Symptoms                              │
│ ├─ User selects symptoms or enters custom text                  │
│ └─ API: POST /client/EditClientHealthConcern                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 6: Arrhythmia Questionnaires (Conditional)                 │
│ ├─ API: GET /Arrhythmia/GetArrhythmiaRequests                   │
│ │  └─ Returns: AI detection results with InitialRiskLevel       │
│ ├─ Filter: Only show questionnaires if:                         │
│ │  • InitialRiskLevel = "HighRisk" OR                           │
│ │  • InitialRiskLevel = "Suspected"                             │
│ │  (Skip if InitialRiskLevel = "Confirmed" = no pattern)        │
│ ├─ For each detected condition:                                 │
│ │  ├─ Load questionnaire from questionnaire.json                │
│ │  ├─ Present questions with Yes/No or multiple choice          │
│ │  ├─ Calculate score: Σ(scoring values for each answer)        │
│ │  └─ Determine QuestionnaireRiskLevel:                         │
│ │     • score >= min_score_threshold → HighRisk                 │
│ │     • score < min_score_threshold → Suspected                 │
│ └─ API: POST /Arrhythmia/EditArrhythmiaQuestionnaire            │
│    └─ Saves all completed questionnaires with scores            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 7: Summary Dashboard                                        │
│ ├─ Displays all detected conditions with color-coded risk:      │
│ │  • GREEN: Confirmed (no AI pattern detected)                  │
│ │  • ORANGE: Suspected (AI pattern + low questionnaire score)   │
│ │  • RED: HighRisk (AI pattern + high questionnaire score)      │
│ └─ APIs: Fetches client data and scan results                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step User Journey

### Step 1: Personal Information (`Newpersonal-info-screen.tsx`)

**User Input:**
- Full Name
- Username
- Email
- Phone Number
- Nationality (dropdown)

**API Call:**
```typescript
POST /client/AddOrUpdateClient
Body: {
  fullName: string,
  username: string,
  email: string,
  phone: string,
  password: "123456",  // Default password
  nationalityId: string
}
Response: {
  Result: {
    Id: string  // Client ID
  }
}
```

**Data Storage:**
```typescript
// Saved to cookie (expires in 1 day)
Cookies.set('userId', data.Result.Id, { expires: 1 });
```

---

### Step 2: Age & Gender (`user-info-screen.tsx`)

**User Input:**
- Age (number input)
- Gender (Male/Female selection)

**API Call:**
```typescript
POST /client/EditClient
Body: {
  id: userId,  // From cookie
  fullName: string,
  username: string,
  email: string,
  phone: string,
  nationalityId: string,
  age: string,
  gender: string  // "Male" or "Female"
}
```

**Data Storage:**
- Updates existing client record in database
- Cookie remains unchanged

---

### Step 3: Face Scanning (`ShenaiScanner.tsx`, `face-scan-screen.tsx`)

**Shenai SDK Process:**
1. SDK initialized with API key
2. User faces camera for 100-second scan
3. SDK captures vital signs using facial blood flow detection
4. Returns comprehensive health metrics

**Data Collected:**
```typescript
{
  heartRate10s: number,
  heartRate4s: number,
  realtimeHeartRate: number,
  hrvSdnn: number,
  cardiacStress: number,
  systolicBp: number,
  diastolicBp: number,
  breathingRate: number,
  healthRisks: {
    cardiacRisk: number,
    respiratoryRisk: number,
    // ... other risk scores
  },
  heartRateIntervals: number[]  // RR intervals for arrhythmia detection
}
```

**API Calls (Simultaneous):**

**1. Save Scan Results:**
```typescript
POST /ScanResult/AddScanResult
Body: {
  clientId: string,
  heartRate10s: number,
  heartRate4s: number,
  realtimeHeartRate: number,
  hrvSdnn: number,
  cardiacStress: number,
  systolicBp: number,
  diastolicBp: number,
  healthRisks: object,
  breathingRate: number,
  heartRateIntervals: number[]
}
```

**2. Arrhythmia AI Detection:**
```typescript
POST /Arrhythmia/AddArrhythmiaRequest
Body: {
  clientId: string,
  inputs: [
    number[]  // Array of heartbeat RR intervals in milliseconds
  ]
}
```

**What Happens Next:**
- The AI model processes the heartbeat intervals asynchronously
- It analyzes patterns for various arrhythmia conditions:
  - Atrial Fibrillation (AFib)
  - Premature Ventricular Contractions (PVC)
  - Premature Atrial Contractions (PAC)
  - Sinus Bradycardia
  - Sinus Tachycardia
  - Supraventricular Tachycardia (SVT)
- For each condition, AI assigns an **InitialRiskLevel**:
  - `"Confirmed"` - No pattern detected (low risk)
  - `"Suspected"` - Weak pattern detected
  - `"HighRisk"` - Strong pattern detected

---

### Step 4: Scan Results Display (`face-scan-result.tsx`)

**API Call:**
```typescript
GET /ScanResult/GetClientLatestScanResult?clientId={userId}
Response: {
  HeartRate10s: number,
  HeartRate4s: number,
  RealtimeHeartRate: number,
  HrvSdnn: number,
  CardiacStress: number,
  SystolicBp: number,
  DiastolicBp: number,
  BreathingRate: number,
  HealthRisks: object
}
```

**Display:**
- Heart rate card
- Blood pressure card
- Breathing rate card
- HRV and stress indicators
- Color-coded health risk scores

---

### Step 5: Health Complaints (`complaint-screen.tsx`)

**User Input:**
- Selects symptoms from predefined list
- Can add custom "other" symptom text

**API Call:**
```typescript
POST /client/EditClientHealthConcern
Body: {
  id: userId,
  healthConcern: string  // Comma-separated symptoms, e.g., "headache, fever, cough"
}
```

**Data Storage:**
- Updates client record with health concerns
- Used for contextualizing health assessment

---

### Step 6: Arrhythmia Questionnaires (`client-assessment.tsx`, `condition-questionnaire.tsx`)

**Fetch AI Detection Results:**
```typescript
GET /Arrhythmia/GetArrhythmiaRequests?clientId={userId}
Response: {
  Result: [
    {
      ArrhythmiaName: string,
      InitialRiskLevel: "Confirmed" | "Suspected" | "HighRisk",
      Detected: boolean,
      QuestionnaireRiskLevel: null,  // Not yet filled
      QuestionnaireScore: null,
      Answers: []
    },
    // ... more conditions
  ]
}
```

**Filter Logic:**
```typescript
const conditionsNeedingQuestionnaires = conditions.filter(
  condition => condition.InitialRiskLevel === 'HighRisk' ||
               condition.InitialRiskLevel === 'Suspected'
);
```

**If no conditions need questionnaires** (all "Confirmed"):
- Skip to Step 7 (Summary)
- All conditions show **GREEN (Low Risk)**

**If conditions need questionnaires:**
- Present questionnaires one by one
- Questions loaded from `questionnaire.json`
- Each questionnaire has:
  - Title (English + Arabic)
  - Questions (text, text_ar)
  - Question types (yes_no or multiple_choice)
  - Scoring rules for each answer
  - `min_score_threshold` for risk determination

**Questionnaire Scoring Process:**
```typescript
// Example from questionnaire.json
{
  "Premature Ventricular Contractions": {
    "questions": [
      {
        "text": "Did you feel any unusual heartbeats recently?",
        "type": "yes_no",
        "scoring": { "Yes": 1, "No": 0 }
      },
      {
        "text": "How often do you experience palpitations?",
        "type": "multiple_choice",
        "options": ["Never", "Rarely", "Sometimes", "Often"],
        "scoring": { "Never": 0, "Rarely": 1, "Sometimes": 2, "Often": 3 }
      }
    ],
    "min_score_threshold": 2,
    "calculated_max_score": 4
  }
}

// Calculate total score
const score = questions.reduce((total, question, index) => {
  const answer = answers[index];
  return total + question.scoring[answer];
}, 0);

// Determine QuestionnaireRiskLevel
const questionnaireRiskLevel =
  score >= min_score_threshold ? 'HighRisk' : 'Suspected';
```

**Save Questionnaire Results:**
```typescript
POST /Arrhythmia/EditArrhythmiaQuestionnaire
Body: {
  conditions: [
    {
      arrhythmiaName: string,
      initialRiskLevel: string,
      questionnaireRiskLevel: "HighRisk" | "Suspected",
      questionnaireScore: number,
      answers: [
        {
          questionText: string,
          answer: string,
          points: number
        }
      ]
    }
  ]
}
```

**Data Storage:**
- All completed questionnaires saved to database
- Associated with client record
- Used for final risk assessment display

---

### Step 7: Summary Dashboard (`health-dashboard.tsx`, `condition-item.tsx`)

**API Calls:**
```typescript
// Fetch client data
GET /client/GetClient?id={userId}

// Fetch scan results
GET /ScanResult/GetClientLatestScanResult?clientId={userId}

// Fetch arrhythmia assessments (with questionnaire results)
GET /Arrhythmia/GetArrhythmiaRequests?clientId={userId}
```

**Display:**
- Client information
- Latest vital signs
- List of all arrhythmia conditions with **color-coded risk levels**

---

## API Endpoints Reference

### Client Management

#### 1. Create/Update Client
```
POST /client/AddOrUpdateClient
Body: { fullName, username, email, phone, password, nationalityId }
Response: { Result: { Id: string } }
Purpose: Creates new client record or updates existing
```

#### 2. Edit Client
```
POST /client/EditClient
Body: { id, fullName, username, email, phone, nationalityId, age, gender }
Purpose: Updates client demographic information
```

#### 3. Get Client
```
GET /client/GetClient?id={userId}
Response: { Result: { Id, FullName, Age, Gender, Email, Phone, Nationality, ... } }
Purpose: Retrieves client profile data
```

#### 4. Edit Client Health Concern
```
POST /client/EditClientHealthConcern
Body: { id, healthConcern: string }
Purpose: Updates client's reported symptoms/complaints
```

---

### Scan Results

#### 5. Add Scan Result
```
POST /ScanResult/AddScanResult
Body: {
  clientId, heartRate10s, heartRate4s, realtimeHeartRate,
  hrvSdnn, cardiacStress, systolicBp, diastolicBp,
  healthRisks, breathingRate, heartRateIntervals
}
Purpose: Saves vital signs collected from face scan
```

#### 6. Get Latest Scan Result
```
GET /ScanResult/GetClientLatestScanResult?clientId={userId}
Response: { HeartRate10s, HeartRate4s, SystolicBp, DiastolicBp, ... }
Purpose: Retrieves most recent scan results for display
```

---

### Arrhythmia Detection & Assessment

#### 7. Add Arrhythmia Request (AI Detection)
```
POST /Arrhythmia/AddArrhythmiaRequest
Body: {
  clientId: string,
  inputs: [number[]]  // Array of RR intervals
}
Purpose: Sends heartbeat intervals to AI for arrhythmia pattern detection
Processing: Asynchronous AI analysis
Result: Creates records with InitialRiskLevel for each condition
```

#### 8. Get Arrhythmia Requests (Results)
```
GET /Arrhythmia/GetArrhythmiaRequests?clientId={userId}
Response: {
  Result: [
    {
      ArrhythmiaName: string,
      InitialRiskLevel: "Confirmed" | "Suspected" | "HighRisk",
      Detected: boolean,
      QuestionnaireRiskLevel: string | null,
      QuestionnaireScore: number | null,
      Answers: array
    }
  ]
}
Purpose: Retrieves AI detection results and questionnaire data
```

#### 9. Edit Arrhythmia Questionnaire
```
POST /Arrhythmia/EditArrhythmiaQuestionnaire
Body: {
  conditions: [
    {
      arrhythmiaName, initialRiskLevel, questionnaireRiskLevel,
      questionnaireScore, answers: [{ questionText, answer, points }]
    }
  ]
}
Purpose: Saves completed questionnaire answers and calculated risk levels
```

---

## Arrhythmia Detection System

### How Heartbeat Data is Sent to AI

**Data Source:** Shenai SDK captures **RR intervals** during face scan
- RR interval = Time between consecutive heartbeats (in milliseconds)
- Typical scan captures 80-120 intervals over 100 seconds
- Example: `[856, 843, 867, 831, 879, ...]`

**API Request:**
```typescript
POST /Arrhythmia/AddArrhythmiaRequest
{
  clientId: "12345",
  inputs: [
    [856, 843, 867, 831, 879, 845, 862, 838, ...]  // RR intervals array
  ]
}
```

**AI Processing:**
1. Backend receives heartbeat intervals
2. AI model analyzes patterns for multiple arrhythmia types simultaneously
3. For each condition (AFib, PVC, PAC, etc.):
   - Pattern matching against known arrhythmia signatures
   - Statistical analysis of interval variability
   - Confidence scoring
4. Assigns **InitialRiskLevel** based on confidence:
   - `"HighRisk"` - Strong pattern detected (high confidence)
   - `"Suspected"` - Weak pattern detected (medium confidence)
   - `"Confirmed"` - No pattern detected (normal)

**What AI Returns:**
```typescript
// Stored in database, retrieved via GET /Arrhythmia/GetArrhythmiaRequests
{
  ArrhythmiaName: "Atrial Fibrillation",
  InitialRiskLevel: "Suspected",  // AI's assessment
  Detected: true,  // true if Suspected or HighRisk
  QuestionnaireRiskLevel: null,  // Filled after questionnaire
  QuestionnaireScore: null,
  Answers: []
}
```

**Conditions Analyzed:**
- Atrial Fibrillation (AFib)
- Premature Ventricular Contractions (PVC)
- Premature Atrial Contractions (PAC)
- Sinus Bradycardia
- Sinus Tachycardia
- Supraventricular Tachycardia (SVT)
- Others (varies by AI model version)

---

## Questionnaire System

### When Questionnaires are Shown

**Logic in `client-assessment.tsx`:**
```typescript
// Fetch AI results
const response = await fetch(`${apiUrl}/Arrhythmia/GetArrhythmiaRequests?clientId=${userId}`);
const allConditions = response.Result;

// Filter conditions needing validation
const conditionsNeedingQuestionnaires = allConditions.filter(
  condition => condition.InitialRiskLevel === 'HighRisk' ||
               condition.InitialRiskLevel === 'Suspected'
);

if (conditionsNeedingQuestionnaires.length === 0) {
  // Skip questionnaires, go to summary
  // All conditions are "Confirmed" (GREEN)
} else {
  // Show questionnaires for each detected condition
}
```

**Key Rule:** Questionnaires are **only shown** if AI detects a pattern (`Suspected` or `HighRisk`). If all conditions are `Confirmed`, no questionnaires are presented.

---

### Questionnaire Structure (`questionnaire.json`)

**Format:**
```json
{
  "[Condition Name]": {
    "title": "English Title",
    "title_ar": "Arabic Title",
    "questions": [
      {
        "text": "Question in English?",
        "text_ar": "السؤال بالعربية؟",
        "type": "yes_no",
        "scoring": {
          "Yes": 1,
          "No": 0
        }
      },
      {
        "text": "Multiple choice question?",
        "type": "multiple_choice",
        "options": ["Option 1", "Option 2", "Option 3"],
        "options_ar": ["الخيار ١", "الخيار ٢", "الخيار ٣"],
        "scoring": {
          "Option 1": 0,
          "Option 2": 1,
          "Option 3": 2
        }
      }
    ],
    "min_score_threshold": 2,
    "calculated_max_score": 3
  }
}
```

**Fields Explained:**
- `title` / `title_ar`: Condition name in English/Arabic
- `questions`: Array of questionnaire questions
  - `text` / `text_ar`: Question text in both languages
  - `type`: `"yes_no"` or `"multiple_choice"`
  - `options` / `options_ar`: Choices for multiple choice questions
  - `scoring`: Points assigned to each answer
- `min_score_threshold`: Score needed to classify as `HighRisk`
- `calculated_max_score`: Maximum possible score

---

### Scoring Algorithm

**Implementation in `condition-questionnaire.tsx`:**

```typescript
// When user completes all questions
const calculateScore = () => {
  const score = conditionQuestionnaire.questions.reduce((total, question, index) => {
    const answer = answers[index];  // User's answer
    return total + (answer ? question.scoring[answer] : 0);
  }, 0);

  return score;
};

// Determine risk level
const determineRiskLevel = (score: number) => {
  const threshold = conditionQuestionnaire.min_score_threshold;

  if (score >= threshold) {
    return 'HighRisk';  // High questionnaire score = High risk
  } else {
    return 'Suspected';  // Low questionnaire score = Suspected
  }
};
```

**Example:**
```
Premature Ventricular Contractions Questionnaire:
- Question 1: "Did you feel unusual heartbeats?" → Yes (1 point)
- Question 2: "How often?" → Sometimes (2 points)
- Question 3: "Do you have chest pain?" → No (0 points)
- Question 4: "Do you feel dizzy?" → Yes (1 point)

Total Score: 1 + 2 + 0 + 1 = 4 points
Threshold: 2 points
Result: 4 >= 2 → QuestionnaireRiskLevel = "HighRisk"
```

---

### Questionnaire Data Storage

**LocalStorage Backup:**
```typescript
// Save to localStorage during questionnaire
localStorage.setItem('questionnaireProgress', JSON.stringify({
  currentConditionIndex,
  completedConditions: [
    {
      ArrhythmiaName: "Atrial Fibrillation",
      InitialRiskLevel: "Suspected",
      QuestionnaireRiskLevel: "HighRisk",
      QuestionnaireScore: 4,
      Answers: [
        { questionText: "...", answer: "Yes", points: 1 }
      ]
    }
  ]
}));
```

**Database Storage:**
```typescript
// After completing all questionnaires
POST /Arrhythmia/EditArrhythmiaQuestionnaire
Body: {
  conditions: completedConditions.map(condition => ({
    arrhythmiaName: condition.ArrhythmiaName,
    initialRiskLevel: condition.InitialRiskLevel,
    questionnaireRiskLevel: condition.QuestionnaireRiskLevel,
    questionnaireScore: condition.QuestionnaireScore,
    answers: condition.Answers
  }))
}
```

---

## Risk Assessment Algorithm

### Complete Risk Determination Logic

**Source: `condition-item.tsx:getRiskColors()`**

```typescript
const getRiskColors = (risk: ConditionWithQuestionnaire) => {
  // CASE 1: No AI pattern detected
  // InitialRiskLevel = "Confirmed"
  // Result: GREEN (Low Risk)
  if (risk.InitialRiskLevel === "Confirmed") {
    return {
      textColor: 'text-green-700',
      bgColor: 'bg-green-600',
      riskLevel: 'Low Risk'
    };
  }

  // CASE 2: AI pattern detected + High questionnaire score
  // QuestionnaireRiskLevel = "HighRisk"
  // Result: RED (High Risk)
  if (risk.QuestionnaireRiskLevel === 'HighRisk') {
    return {
      textColor: 'text-red-700',
      bgColor: 'bg-red-600',
      riskLevel: 'High Risk'
    };
  }

  // CASE 3: AI pattern detected + Low questionnaire score
  // QuestionnaireRiskLevel = "Suspected"
  // Result: ORANGE (Suspected)
  if (risk.QuestionnaireRiskLevel === 'Suspected') {
    return {
      textColor: 'text-orange-700',
      bgColor: 'bg-orange-500',
      riskLevel: 'Suspected'
    };
  }

  // FALLBACK: If detected but no questionnaire completed yet
  if (risk.Detected) {
    return {
      textColor: 'text-orange-700',
      bgColor: 'bg-orange-500',
      riskLevel: 'Suspected'
    };
  }

  // DEFAULT: Not detected
  return {
    textColor: 'text-green-700',
    bgColor: 'bg-green-600',
    riskLevel: 'Low Risk'
  };
};
```

---

### Risk Level Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│ AI Detection (InitialRiskLevel)                             │
└──────────────────┬──────────────────────────────────────────┘
                   │
       ┌───────────┴───────────┐
       │                       │
       ▼                       ▼
  "Confirmed"            "Suspected" or "HighRisk"
  (No pattern)           (Pattern detected)
       │                       │
       ▼                       ▼
   ┌───────┐          ┌─────────────────┐
   │ GREEN │          │ Show             │
   │       │          │ Questionnaire    │
   │ Low   │          └────────┬─────────┘
   │ Risk  │                   │
   └───────┘         ┌─────────┴─────────┐
                     │                   │
                     ▼                   ▼
              Score < Threshold    Score >= Threshold
                     │                   │
                     ▼                   ▼
                 ┌────────┐          ┌─────┐
                 │ ORANGE │          │ RED │
                 │        │          │     │
                 │ Susp.  │          │High │
                 └────────┘          │Risk │
                                     └─────┘
```

---

### Confirmed User's Logic

**User's Expected Behavior:**
1. ✅ **No AI risk** (`InitialRiskLevel = "Confirmed"`) → **GREEN (Low Risk)**
   - No questionnaire shown
   - Condition marked as safe

2. ✅ **AI risk + negative/no answers** (low score) → **ORANGE (Suspected)**
   - Questionnaire shown because AI detected pattern
   - User answers indicate low symptom severity
   - `QuestionnaireScore < min_score_threshold`
   - Result: `QuestionnaireRiskLevel = "Suspected"`

3. ✅ **AI risk + positive/yes answers** (high score) → **RED (High Risk)**
   - Questionnaire shown because AI detected pattern
   - User answers indicate high symptom severity
   - `QuestionnaireScore >= min_score_threshold`
   - Result: `QuestionnaireRiskLevel = "HighRisk"`

**Confirmation:** The implementation matches the user's expected logic exactly.

---

### Risk Assessment Examples

#### Example 1: Normal Heart Rhythm
```
AI Detection Result:
- InitialRiskLevel: "Confirmed"
- Detected: false

Questionnaire:
- Not shown (no pattern detected)

Final Risk Assessment:
- Color: GREEN
- Level: Low Risk
- Display: "Normal - No arrhythmia detected"
```

#### Example 2: Suspected Arrhythmia with Mild Symptoms
```
AI Detection Result:
- InitialRiskLevel: "Suspected"
- Detected: true

Questionnaire Answers:
- "Did you feel unusual heartbeats?" → No (0 points)
- "How often do you feel palpitations?" → Rarely (1 point)
- "Do you have chest pain?" → No (0 points)
- Total Score: 1 point

Risk Determination:
- min_score_threshold: 2
- 1 < 2 → QuestionnaireRiskLevel = "Suspected"

Final Risk Assessment:
- Color: ORANGE
- Level: Suspected
- Display: "Suspected - Monitor symptoms"
```

#### Example 3: High Risk Arrhythmia with Severe Symptoms
```
AI Detection Result:
- InitialRiskLevel: "HighRisk"
- Detected: true

Questionnaire Answers:
- "Did you feel unusual heartbeats?" → Yes (1 point)
- "How often do you feel palpitations?" → Often (3 points)
- "Do you have chest pain?" → Yes (1 point)
- Total Score: 5 points

Risk Determination:
- min_score_threshold: 2
- 5 >= 2 → QuestionnaireRiskLevel = "HighRisk"

Final Risk Assessment:
- Color: RED
- Level: High Risk
- Display: "High Risk - Seek medical attention"
```

---

## Data Storage Strategy

### 1. Cookie Storage

**Purpose:** Session persistence for current user

**Stored Data:**
```typescript
Cookies.set('userId', clientId, { expires: 1 });  // Expires in 1 day
```

**Usage:**
- Primary identifier for all API requests
- Retrieved at each step: `const userId = Cookies.get('userId')`
- Cleared on logout or session timeout

---

### 2. LocalStorage

**Purpose:** Questionnaire progress backup and recovery

**Stored Data:**
```typescript
// During questionnaire completion
localStorage.setItem('questionnaireProgress', JSON.stringify({
  currentConditionIndex: number,
  completedConditions: ConditionWithQuestionnaire[]
}));
```

**Usage:**
- Prevents data loss if browser refreshes during questionnaire
- Restored on component mount
- Cleared after successful database save

---

### 3. Backend Database (MongoDB)

**Purpose:** Permanent storage of all health data

**Collections:**

#### Clients Collection
```typescript
{
  _id: ObjectId,
  Id: string,  // UUID
  FullName: string,
  Username: string,
  Email: string,
  Phone: string,
  NationalityId: string,
  Age: string,
  Gender: string,
  HealthConcern: string,  // Comma-separated symptoms
  CreatedAt: Date,
  UpdatedAt: Date
}
```

#### ScanResults Collection
```typescript
{
  _id: ObjectId,
  ClientId: string,
  HeartRate10s: number,
  HeartRate4s: number,
  RealtimeHeartRate: number,
  HrvSdnn: number,
  CardiacStress: number,
  SystolicBp: number,
  DiastolicBp: number,
  BreathingRate: number,
  HealthRisks: object,
  HeartRateIntervals: number[],
  CreatedAt: Date
}
```

#### ArrhythmiaRequests Collection
```typescript
{
  _id: ObjectId,
  ClientId: string,
  ArrhythmiaName: string,
  InitialRiskLevel: string,  // "Confirmed", "Suspected", "HighRisk"
  Detected: boolean,
  QuestionnaireRiskLevel: string | null,
  QuestionnaireScore: number | null,
  Answers: [
    {
      QuestionText: string,
      Answer: string,
      Points: number
    }
  ],
  CreatedAt: Date,
  UpdatedAt: Date
}
```

---

### Data Flow Summary

```
User Input → Frontend State → Cookie/LocalStorage (temporary)
                ↓
         API Request
                ↓
    MongoDB Database (permanent)
                ↓
      API Response → Frontend Display
```

---

## Conclusion

This documentation provides a complete overview of the Health Kiosk Application's data flow, from user input collection through AI-powered arrhythmia detection to final risk assessment.

**Key Takeaways:**
1. **Multi-tiered Risk Assessment**: Combines AI pattern detection with user-reported symptoms
2. **Conditional Questionnaires**: Only shown when AI detects potential arrhythmias
3. **Scoring System**: Transparent, threshold-based risk determination
4. **Color-Coded Results**:
   - GREEN = No risk detected
   - ORANGE = Suspected, requires monitoring
   - RED = High risk, seek medical attention
5. **Data Persistence**: Multiple layers (cookies, localStorage, database) ensure reliability
6. **Internationalization**: Full English/Arabic support throughout the flow

**Risk Assessment Confirmation:**
- ✅ No AI risk = Low risk (GREEN) - No questionnaire needed
- ✅ AI risk + low questionnaire score = Suspected (ORANGE)
- ✅ AI risk + high questionnaire score = High risk (RED)

The system provides a comprehensive, user-friendly health screening experience with clear risk communication and data-driven assessments.
