# CoreVision - Project Master Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [API Documentation](#api-documentation)
4. [Database Schema](#database-schema)
5. [Application Services](#application-services)
6. [Data Transfer Objects (DTOs)](#data-transfer-objects)
7. [Data Flow & Integration](#data-flow--integration)
8. [Security & Authentication](#security--authentication)
9. [Configuration](#configuration)
10. [Development Guide](#development-guide)

---

## Project Overview

**CoreVision** is a comprehensive health monitoring and cardiovascular assessment platform designed for medical kiosks and health screening applications.

### Purpose
- Real-time vital signs monitoring (heart rate, blood pressure, temperature, glucose, HbA1c)
- ECG-based arrhythmia detection using AI/ML external services
- Cardiovascular disease risk assessment
- Medical report generation and email delivery
- Patient health data management and analytics

### Technology Stack
- **Framework**: ASP.NET Core 6.0+ with ABP Framework (ASP.NET Boilerplate)
- **Database**: SQL Server with Entity Framework Core
- **Authentication**: JWT Bearer tokens
- **Email**: MailKit with SMTP
- **Logging**: Serilog + log4net
- **Data Mapping**: AutoMapper
- **Multi-tenancy**: ABP Zero support

### Key Features
1. Patient/Client management with comprehensive health profiles
2. Vital signs scanning and historical tracking
3. AI-powered arrhythmia detection (9 types)
4. Risk assessment algorithms (CVD, diabetes, hypertension)
5. Medical report generation (bilingual: English/Arabic)
6. Physician user management
7. Statistical reporting and analytics
8. Payment status control

---

## System Architecture

### Layered Architecture

```
┌─────────────────────────────────────────┐
│         Web.Host (API Layer)            │
│   Controllers + JWT Auth + CORS         │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Application Layer                  │
│   AppServices + DTOs + Business Logic   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      EntityFrameworkCore Layer          │
│   DbContext + Repositories + Migrations │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Core/Domain Layer               │
│   Entities + Interfaces + Enums         │
└─────────────────────────────────────────┘
```

### Project Structure
```
CoreVision.sln
├── CoreVision.Core              # Domain entities and interfaces
├── CoreVision.Application       # Business logic and DTOs
├── CoreVision.EntityFrameworkCore  # EF Core, DbContext, Migrations
├── CoreVision.Web.Core          # Web shared components
└── CoreVision.Web.Host          # API Controllers and hosting
```

---

## API Documentation

**Base URL**: `http://localhost:5000/api` (configurable)
**Authentication**: JWT Bearer token (except TokenAuth/Authenticate)
**Content-Type**: `application/json`

### 1. Arrhythmia API

**Controller**: `ArrhythmiaController.cs`
**Route**: `/api/Arrhythmia/`
**Purpose**: ECG analysis and arrhythmia detection

#### Endpoints

##### GET /api/Arrhythmia/GetArrhythmiaRequest
Get a single arrhythmia request for a client.

**Parameters**:
- `clientId` (query, int): Client identifier

**Response**: `ArrhythmiaDetectionRequestDto`
```json
{
  "id": 1,
  "clientId": 123,
  "scanId": 456,
  "requestId": "uuid",
  "creationTime": "2025-10-15T10:30:00Z",
  "arrhythmiaResults": [
    {
      "id": 1,
      "arrhythmiaName": "Atrial Fibrillation",
      "arrhythmiaShortName": "AFib",
      "detected": true,
      "confidence": 92.5,
      "prediction": 0.925,
      "initialRiskLevel": "HighRisk",
      "questionnaireRiskLevel": "Confirmed",
      "questionnaireScore": 8,
      "questionnaireAnswers": [
        {"index": 1, "answer": "Yes"}
      ]
    }
  ]
}
```

##### GET /api/Arrhythmia/GetArrhythmiaRequests
Get all arrhythmia requests for a client.

**Parameters**:
- `clientId` (query, int): Client identifier

**Response**: `List<ArrhythmiaDetectionRequestDto>`

##### POST /api/Arrhythmia/AddArrhythmiaRequest
Submit ECG data for arrhythmia analysis.

**Body**: `ArrhythmiaRequestDto`
```json
{
  "clientId": 123,
  "scanId": 456,
  "inputs": [
    [0.5, 0.6, 0.7, ...], // Array of at least 100 ECG readings
    [0.4, 0.5, 0.6, ...]
  ]
}
```

**Response**: `RequestResult<ArrhythmiaDetectionRequestDto>`

**Arrhythmia Types Detected**:
1. Atrial Fibrillation (AFib)
2. Atrial Flutter (AFLut)
3. Sleep Apnea (Apnea)
4. Congestive Heart Failure (CHF)
5. Heart Block (HBlock)
6. Myocardial Infarction (MI)
7. Premature Ventricular Contractions (PVCs)
8. Sinus Bradycardia (SB)
9. Supraventricular Tachycardia (SVT)

**Risk Levels**:
- `Confirmed`: Not detected by AI
- `HighRisk`: Detected with confidence >= 85%
- `Suspected`: Detected with confidence < 85%

##### GET /api/Arrhythmia/GetArrhythmiaSummaries
Get statistical summaries of arrhythmia detection.

**Parameters**:
- `nationality` (query, int, optional): Filter by country
- `gender` (query, string, optional): Filter by gender
- `ageGroup` (query, string, optional): Filter by age group

**Response**: `List<ArrhythmiaReportDto>`

##### POST /api/Arrhythmia/EditArrhythmiaQuestionnaire
Update arrhythmia questionnaire responses and risk levels.

**Body**: `EditArrhythmiaQuestionnaireDto`
```json
{
  "arrhythmiaResultId": 1,
  "questionnaireRiskLevel": "Confirmed",
  "questionnaireScore": 8,
  "questionnaireAnswers": [
    {"index": 1, "answer": "Yes"},
    {"index": 2, "answer": "No"}
  ]
}
```

**Response**: `RequestResult<object>`

---

### 2. ScanResult API

**Controller**: `ScanResultController.cs`
**Route**: `/api/ScanResult/`
**Purpose**: Vital signs measurement storage and retrieval

#### Endpoints

##### GET /api/ScanResult/GetClientLatestScanResult
Get the most recent scan for a client.

**Parameters**:
- `clientId` (query, int): Client identifier

**Response**: `ScanResultDto`
```json
{
  "id": 1,
  "clientId": 123,
  "heartRate10s": 72,
  "heartRate4s": 70,
  "realTimeHeartRate": 71,
  "systolicBloodPressure": 120,
  "diastolicBloodPressureMmhg": 80,
  "temperature": 36.5,
  "glucose": 95,
  "hba1c": 5.5,
  "breathingRate": 16,
  "heartRateVariability": 50,
  "cardiacStress": 2.5,
  "creationTime": "2025-10-15T10:30:00Z",
  "healthRisk": {
    "id": 1,
    "scanId": 1,
    "diabetesRisk": 15.5,
    "hypertensionRisk": 20.3,
    "vascularAge": 45,
    "wellnessScore": 75,
    "bodyFatPercentage": 22.5,
    "bmi": 24.5,
    "cvDisease": {
      "coronaryHeartDiseaseRisk": 10.5,
      "heartFailureRisk": 5.2,
      "strokeRisk": 8.3,
      "peripheralVascularDiseaseRisk": 4.1,
      "overallRisk": 12.5
    },
    "hardAndFatalEvent": {
      "coronaryDeathEventRisk": 2.5,
      "fatalStrokeEventRisk": 1.8,
      "hardCVEventRisk": 8.5,
      "totalCVMortalityRisk": 5.3
    },
    "score": {
      "ageScore": 3,
      "bmiScore": 2,
      "cholesterolScore": 1,
      "diabetesScore": 0,
      "sbpScore": 2,
      "smokingScore": 0,
      "totalScore": 8
    }
  }
}
```

##### GET /api/ScanResult/GetScanResultsByClientId
Get all scan results for a client (ordered by date).

**Parameters**:
- `clientId` (query, int): Client identifier

**Response**: `List<ScanResultDto>`

##### POST /api/ScanResult/AddScanResult
Create a new scan result.

**Body**: `ScanResultDto` (see structure above)

**Response**: `RequestResult<ScanResultDto>`

---

### 3. Client API

**Controller**: `ClientController.cs`
**Route**: `/api/Client/`
**Purpose**: Patient/client management

#### Endpoints

##### GET /api/Client/GetClient
Get single client details.

**Parameters**:
- `id` (query, int): Client identifier

**Response**: `ClientDto`
```json
{
  "id": 123,
  "userName": "john_doe",
  "email": "john@example.com",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "age": 45,
  "gender": "Male",
  "nationalityId": 1,
  "nationality": "United States",
  "height": 175,
  "weight": 75,
  "bmi": 24.5,
  "heartRate": 72,
  "bloodPressure": "120/80",
  "temperature": 36.5,
  "oxygonSaturation": 98,
  "spo2": 98,
  "medicalConditions": "Hypertension",
  "medicalHistory": "None",
  "familyHistory": "Diabetes",
  "diabetes": false,
  "hypertension": true,
  "smoking": false,
  "alcohol": false,
  "exercise": "Moderate",
  "diet": "Balanced",
  "sleepHours": 7,
  "stressLevel": "Low",
  "mentalHealth": "Good",
  "pregnant": false,
  "pregnancyWeeks": 0,
  "medications": "Lisinopril",
  "allergies": "None",
  "emergencyContact": "+0987654321",
  "creationTime": "2025-01-01T10:00:00Z"
}
```

##### GET /api/Client/GetClients
Get all clients.

**Response**: `List<ClientDto>`

##### POST /api/Client/AddOrUpdateClient
Create or update client.

**Body**: `ClientDto`

**Response**: `RequestResult<ClientDto>`

##### POST /api/Client/AddClientMessages
Add messages for a client.

**Body**: `ClientDto` (with messages)

**Response**: `RequestResult<ClientDto>`

##### POST /api/Client/EditClient
Update client data.

**Body**: `ClientDto`

**Response**: `RequestResult<ClientDto>`

##### POST /api/Client/EditClientHealthConcern
Update client health concerns.

**Body**: `ClientDto`

**Response**: `RequestResult<ClientDto>`

##### POST /api/Client/GetClientsReport
Get paginated client report with filtering.

**Body**: `ClientReportQueryOption`
```json
{
  "pageNumber": 1,
  "pageSize": 20,
  "nationality": "United States",
  "gender": "Male",
  "ageGroup": "40-50",
  "name": "John",
  "arrhythmiaDetection": true,
  "riskStatus": "HighRisk"
}
```

**Response**: `PaginatedList<ClientReportDto>`
```json
{
  "items": [
    {
      "id": 123,
      "fullName": "John Doe",
      "age": 45,
      "gender": "Male",
      "nationality": "United States",
      "heartRate": 72,
      "bloodPressure": "120/80",
      "riskCategory": "Moderate",
      "hasArrhythmia": true,
      "lastScanDate": "2025-10-15T10:30:00Z"
    }
  ],
  "pageNumber": 1,
  "totalPages": 5,
  "totalCount": 100,
  "hasPreviousPage": false,
  "hasNextPage": true
}
```

##### GET /api/Client/GetClientProfile
Get comprehensive client profile with latest readings and arrhythmia risks.

**Parameters**:
- `clientId` (query, int): Client identifier

**Response**: `ClientProfileDto`
```json
{
  "client": { /* ClientDto */ },
  "nationality": "United States",
  "latestReading": {
    "heartRate": 72,
    "bloodPressure": "120/80",
    "temperature": 36.5,
    "glucose": 95,
    "scanDate": "2025-10-15T10:30:00Z"
  },
  "possibleCauses": [
    {
      "possibleCause": "Hypertension",
      "level": "Moderate"
    }
  ],
  "arrhythmiaRisks": [
    {
      "arrhythmiaName": "Atrial Fibrillation",
      "riskLevel": "HighRisk",
      "confidence": 92.5
    }
  ]
}
```

---

### 4. Common API

**Controller**: `CommonController.cs`
**Route**: `/api/Common/`
**Purpose**: Reference data

#### Endpoints

##### GET /api/Common/GetCountries
Get list of all countries.

**Response**: `List<CountryDto>`
```json
[
  {
    "id": 0,
    "englishName": "All",
    "arabicName": "الكل"
  },
  {
    "id": 1,
    "englishName": "United States",
    "arabicName": "الولايات المتحدة",
    "isoCode": "US",
    "flag": "🇺🇸",
    "isActive": true
  }
]
```

---

### 5. Email API

**Controller**: `EmailController.cs`
**Route**: `/api/Email/`
**Purpose**: Email delivery and medical report generation

#### Endpoints

##### POST /api/Email/SendEmail
Send plain or HTML email.

**Body**: `EmailRequestDto`
```json
{
  "receiver": "patient@example.com",
  "subject": "Health Assessment Results",
  "text": "Your health assessment is ready.",
  "isHtml": false
}
```

**Response**: `RequestResult<object>`
```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": null
}
```

##### POST /api/Email/SendMedicalReport
Send formatted medical report email (bilingual).

**Body**: `MedicalReportEmailRequestDto`
```json
{
  "receiver": "patient@example.com",
  "subject": "Health Assessment Report",
  "reportData": {
    "patientName": "John Doe",
    "age": 45,
    "gender": "Male",
    "date": "2025-10-15",
    "time": "10:30 AM",
    "heartRate": 72,
    "systolicBP": 120,
    "diastolicBP": 80,
    "temperature": 36.5,
    "glucose": 95,
    "hba1c": 5.5,
    "oxygenSaturation": 98,
    "arrhythmiaResults": [
      {
        "name": "Atrial Fibrillation",
        "detected": true,
        "confidence": 92.5,
        "riskLevel": "High"
      }
    ]
  }
}
```

**Response**: `RequestResult<object>`

**Features**:
- Bilingual HTML email (English/Arabic)
- Color-coded risk indicators (Normal/Elevated/High)
- Professional medical report formatting
- Comprehensive request/response logging with request ID
- SMTP with StartTLS security

---

### 6. User API

**Controller**: `UserController.cs`
**Route**: `/api/User/`
**Purpose**: Physician user management

#### Endpoints

##### GET /api/User/GetPhysicians
Get list of all physicians.

**Response**: `List<UserDto>`
```json
[
  {
    "id": 1,
    "userName": "dr_smith",
    "name": "Dr. Smith",
    "surname": "Johnson",
    "emailAddress": "dr.smith@hospital.com",
    "phoneNumber": "+1234567890",
    "isActive": true,
    "userType": "Physician",
    "creationTime": "2025-01-01T10:00:00Z"
  }
]
```

##### POST /api/User/AddPhysician
Create new physician user.

**Body**: `CreateUserDto`
```json
{
  "userName": "dr_jones",
  "name": "Dr. Jones",
  "surname": "Williams",
  "emailAddress": "dr.jones@hospital.com",
  "phoneNumber": "+1234567890",
  "password": "SecurePassword123!",
  "isActive": true
}
```

**Response**: `RequestResult<UserDto>`

##### POST /api/User/EditPhysician
Update physician user.

**Body**: `UserDto`

**Response**: `RequestResult<UserDto>`

##### DELETE /api/User/DeletePhysician
Delete physician user.

**Parameters**:
- `userId` (query, int): User identifier

**Response**: `RequestResult<object>`

---

### 7. TokenAuth API

**Controller**: `TokenAuthController.cs`
**Route**: `/api/TokenAuth/`
**Purpose**: Authentication (NO JWT required for this endpoint)

#### Endpoints

##### POST /api/TokenAuth/Authenticate
User login and JWT token generation.

**Body**: `AuthenticateModel`
```json
{
  "userNameOrEmailAddress": "dr_smith",
  "password": "SecurePassword123!"
}
```

**Response**: `AuthenticateResultModel`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "encryptedAccessToken": "encrypted_token_string",
  "expireInSeconds": 3600,
  "userId": 1,
  "userType": "Physician"
}
```

**Token Usage**:
Include in subsequent requests:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 8. PaymentStatus API

**Controller**: `PaymentStatusController.cs`
**Route**: `/api/PaymentStatus/`
**Purpose**: Service enable/disable control

#### Endpoints

##### GET /api/PaymentStatus/GetStatus
Get current payment validity and service enabled status.

**Response**:
```json
{
  "isValid": true,
  "enableService": true
}
```

##### POST /api/PaymentStatus/SetStatus
Set payment status.

**Body**: `SetPaymentStatusRequest`
```json
{
  "isValid": true,
  "enableService": true
}
```

**Response**: `RequestResult<object>`

##### POST /api/PaymentStatus/ToggleStatus
Toggle payment valid status.

**Response**: `RequestResult<object>`

---

## Database Schema

### Database Context
**File**: `CoreVisionDbContext.cs`
**Provider**: SQL Server with Entity Framework Core
**Framework**: ABP Zero (Multi-tenant support)

### Entity Relationships Diagram

```
┌─────────────┐
│   Country   │
│ (Reference) │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────▼──────────────────────────────────────────────┐
│                      Client                          │
│  - Demographics (Name, Age, Gender, Contact)         │
│  - Health Profile (Vitals, Medical History)          │
│  - Lifestyle (Exercise, Diet, Stress)                │
└──┬────┬────┬──────────────────────────────────────┬─┘
   │    │    │                                      │
   │ 1  │ 1  │ 1                                    │ 1
   │    │    │                                      │
   │ N  │ N  │ N                                    │ N
   │    │    │                                      │
┌──▼────┐ ┌──▼──────────┐ ┌──────────────────────┐ ┌▼─────────────────┐
│ Scan  │ │ArrhythmiaReq│ │  ClientMessage       │ │ClientPossibleCause│
│Result │ │             │ │                      │ │                  │
└───┬───┘ └──────┬──────┘ └──────────────────────┘ └──────────────────┘
    │            │
    │ 1          │ 1
    │            │
    │ 1          │ N
    │            │
┌───▼──────┐ ┌──▼────────────┐
│HealthRisk│ │ArrhythmiaResult│
│          │ │                │
└─┬──┬──┬──┘ └────────┬───────┘
  │  │  │             │ 1
  │1 │1 │1            │
  │  │  │             │ N
  │1 │1 │1            │
  │  │  │         ┌───▼────────────────────┐
┌─▼──▼──▼─┐       │ArrhythmiaQuestionnaire │
│CvDisease│       │        Answer          │
│HardEvent│       └────────────────────────┘
│  Score  │
└─────────┘
```

### Entity Definitions

#### 1. Client
**Table**: `Clients`
**Inherits**: `AuditedEntity` (Id, CreationTime, CreatorUserId, LastModificationTime, LastModifierUserId)

**Primary Fields**:
| Column | Type | Description |
|--------|------|-------------|
| Id | int | Primary key |
| UserName | string | Unique username |
| Email | string | Email address |
| FullName | string | Full name |
| Phone | string | Phone number |
| Age | int | Age in years |
| Gender | string | Gender (Male/Female/Other) |
| NationalityId | int | Foreign key to Country |

**Health Metrics**:
| Column | Type | Description |
|--------|------|-------------|
| HeartRate | int? | Heart rate (bpm) |
| BloodPressure | string | Blood pressure (e.g., "120/80") |
| Temperature | decimal? | Body temperature (°C) |
| OxygonSaturation | int? | Oxygen saturation (%) |
| SPO2 | int? | SpO2 level (%) |
| Height | decimal? | Height (cm) |
| Weight | decimal? | Weight (kg) |
| BMI | decimal? | Body Mass Index |

**Medical Information**:
| Column | Type | Description |
|--------|------|-------------|
| MedicalConditions | string | Current medical conditions |
| MedicalHistory | string | Past medical history |
| FamilyHistory | string | Family medical history |
| Diabetes | bool | Has diabetes |
| Hypertension | bool | Has hypertension |
| Smoking | bool | Smoking status |
| Alcohol | bool | Alcohol consumption |
| Exercise | string | Exercise habits |
| Diet | string | Diet description |
| SleepHours | int? | Hours of sleep per night |
| StressLevel | string | Stress level |
| MentalHealth | string | Mental health status |
| Pregnant | bool | Pregnancy status |
| PregnancyWeeks | int? | Weeks pregnant |
| Medications | string | Current medications |
| Allergies | string | Known allergies |
| EmergencyContact | string | Emergency contact info |
| UserType | string | User type classification |

**Relationships**:
- `Country Nationality` (Many-to-One)
- `ICollection<ScanResult> ScanResults` (One-to-Many)
- `ICollection<ClientMessage> ClientMessages` (One-to-Many)
- `ICollection<ArrhythmiaDetectionRequest> ArrhythmiaDetectionRequests` (One-to-Many)
- `ICollection<ClientPossibleCause> ClientPossibleCauses` (One-to-Many)

---

#### 2. ScanResult
**Table**: `ScanResults`
**Inherits**: `AuditedEntity`

**Fields**:
| Column | Type | Description |
|--------|------|-------------|
| Id | int | Primary key |
| ClientId | int | Foreign key to Client |
| HeartRate10s | decimal? | Heart rate over 10 seconds |
| HeartRate4s | decimal? | Heart rate over 4 seconds |
| RealTimeHeartRate | decimal? | Real-time heart rate |
| SystolicBloodPressure | int? | Systolic BP (mmHg) |
| DiastolicBloodPressureMmhg | int? | Diastolic BP (mmHg) |
| Temperature | decimal? | Temperature (°C) |
| Glucose | decimal? | Blood glucose (mg/dL) |
| Hba1c | decimal? | HbA1c level (%) |
| BreathingRate | int? | Respiration rate (breaths/min) |
| HeartRateVariability | decimal? | HRV (ms) |
| CardiacStress | decimal? | Cardiac stress index |
| HeartRateIntervals | string | JSON array of intervals |

**Relationships**:
- `Client Client` (Many-to-One)
- `HealthRisk HealthRisk` (One-to-One)

---

#### 3. HealthRisk
**Table**: `HealthRisks`
**Inherits**: `AuditedEntity`

**Fields**:
| Column | Type | Description |
|--------|------|-------------|
| Id | int | Primary key |
| ScanId | int | Foreign key to ScanResult |
| DiabetesRisk | decimal? | Diabetes risk percentage |
| HypertensionRisk | decimal? | Hypertension risk percentage |
| VascularAge | int? | Calculated vascular age |
| WellnessScore | decimal? | Overall wellness score |
| BodyFatPercentage | decimal? | Body fat percentage |
| BodyRoundnessIndex | decimal? | BRI value |
| WaistToHeightRatio | decimal? | WHtR value |
| BMI | decimal? | Body Mass Index |
| BMIPercentage | decimal? | BMI percentage |
| BMIPrime | decimal? | BMI prime value |

**Relationships**:
- `ScanResult ScanResult` (One-to-One)
- `CvDisease CvDisease` (One-to-One)
- `HardAndFatalEvent HardAndFatalEvent` (One-to-One)
- `Score Score` (One-to-One)

---

#### 4. CvDisease
**Table**: `CvDiseases`
**Inherits**: `Entity`

**Fields**:
| Column | Type | Description |
|--------|------|-------------|
| Id | int | Primary key |
| HealthRiskId | int | Foreign key to HealthRisk |
| CoronaryHeartDiseaseRisk | decimal? | CHD risk percentage |
| HeartFailureRisk | decimal? | Heart failure risk percentage |
| StrokeRisk | decimal? | Stroke risk percentage |
| PeripheralVascularDiseaseRisk | decimal? | PVD risk percentage |
| OverallRisk | decimal? | Overall CV risk percentage |

**Relationships**:
- `HealthRisk HealthRisk` (One-to-One)

---

#### 5. HardAndFatalEvent
**Table**: `HardAndFatalEvents`
**Inherits**: `Entity`

**Fields**:
| Column | Type | Description |
|--------|------|-------------|
| Id | int | Primary key |
| HealthRiskId | int | Foreign key to HealthRisk |
| CoronaryDeathEventRisk | decimal? | Coronary death risk |
| FatalStrokeEventRisk | decimal? | Fatal stroke risk |
| HardCVEventRisk | decimal? | Hard CV event risk |
| TotalCVMortalityRisk | decimal? | Total CV mortality risk |

**Relationships**:
- `HealthRisk HealthRisk` (One-to-One)

---

#### 6. Score
**Table**: `Scores`
**Inherits**: `Entity`

**Fields**:
| Column | Type | Description |
|--------|------|-------------|
| Id | int | Primary key |
| HealthRiskId | int | Foreign key to HealthRisk |
| AgeScore | int? | Age score component |
| BmiScore | int? | BMI score component |
| CholesterolScore | int? | Cholesterol score component |
| CholesterolHdlScore | int? | HDL score component |
| DiabetesScore | int? | Diabetes score component |
| SbpScore | int? | Systolic BP score component |
| SmokingScore | int? | Smoking score component |
| TotalScore | int? | Total risk score |

**Relationships**:
- `HealthRisk HealthRisk` (One-to-One)

---

#### 7. ArrhythmiaDetectionRequest
**Table**: `ArrhythmiaDetectionRequests`
**Inherits**: `AuditedEntity`

**Fields**:
| Column | Type | Description |
|--------|------|-------------|
| Id | int | Primary key |
| ClientId | int | Foreign key to Client |
| ScanId | int? | Optional scan reference |
| RequestId | Guid | Unique request identifier |

**Relationships**:
- `Client Client` (Many-to-One)
- `ICollection<ArrhythmiaResult> ArrhythmiaResults` (One-to-Many)

---

#### 8. ArrhythmiaResult
**Table**: `ArrhythmiaResults`
**Inherits**: `AuditedEntity`

**Fields**:
| Column | Type | Description |
|--------|------|-------------|
| Id | int | Primary key |
| ArrhythmiaDetectionRequestId | int | Foreign key to Request |
| ApiName | string | External API identifier |
| ArrhythmiaName | string | Full arrhythmia name |
| ArrhythmiaShortName | string | Abbreviated name (e.g., AFib) |
| Confidence | decimal? | AI confidence score (0-100) |
| Detected | bool | Detection result |
| Prediction | decimal? | Prediction value |
| InitialRiskLevel | string | Risk level from AI |
| QuestionnaireRiskLevel | string | Risk level after questionnaire |
| QuestionnaireScore | int? | Questionnaire score |
| Success | bool | API call success |
| ErrorMessage | string | Error message if failed |

**Relationships**:
- `ArrhythmiaDetectionRequest ArrhythmiaDetectionRequest` (Many-to-One)
- `ICollection<ArrhythmiaQuestionnaireAnswer> QuestionnaireAnswers` (One-to-Many)

**9 Arrhythmia Types**:
1. Atrial Fibrillation (AFib)
2. Atrial Flutter (AFLut)
3. Sleep Apnea (Apnea)
4. Congestive Heart Failure (CHF)
5. Heart Block (HBlock)
6. Myocardial Infarction (MI)
7. Premature Ventricular Contractions (PVCs)
8. Sinus Bradycardia (SB)
9. Supraventricular Tachycardia (SVT)

---

#### 9. ArrhythmiaQuestionnaireAnswer
**Table**: `ArrhythmiaQuestionnaireAnswers`
**Inherits**: `AuditedEntity<int>`

**Fields**:
| Column | Type | Description |
|--------|------|-------------|
| Id | int | Primary key |
| ArrhythmiaResultId | int | Foreign key to ArrhythmiaResult |
| Index | int | Question index |
| Answer | string | Answer text |

**Relationships**:
- `ArrhythmiaResult ArrhythmiaResult` (Many-to-One)

---

#### 10. ArrhythmiaSummary
**Table**: `ArrhythmiaSummaries`
**Inherits**: `AuditedEntity<int>`

**Fields**:
| Column | Type | Description |
|--------|------|-------------|
| Id | int | Primary key |
| ArrhythmiaName | string | Arrhythmia type name |
| RiskLevel | string | Risk level (Suspected/HighRisk/Confirmed) |
| NationalityId | int? | Country filter |
| Gender | string | Gender filter |
| AgeGroup | string | Age group filter |
| ClientCount | int | Count of matching clients |

**Purpose**: Statistical aggregation for reporting

---

#### 11. ArrhythmiaReport
**Table**: `ArrhythmiaReports`
**Inherits**: `AuditedEntity<int>`

**Fields**:
| Column | Type | Description |
|--------|------|-------------|
| Id | int | Primary key |
| CountryId | int? | Country filter |
| Gender | string | Gender filter |
| AgeGroup | string | Age group filter |

**Arrhythmia Counts** (for each of 9 types):
- AFib_Suspected, AFib_AtRisk, AFib_Confirmed
- AFLut_Suspected, AFLut_AtRisk, AFLut_Confirmed
- Apnea_Suspected, Apnea_AtRisk, Apnea_Confirmed
- CHF_Suspected, CHF_AtRisk, CHF_Confirmed
- HBlock_Suspected, HBlock_AtRisk, HBlock_Confirmed
- MI_Suspected, MI_AtRisk, MI_Confirmed
- PVCs_Suspected, PVCs_AtRisk, PVCs_Confirmed
- SB_Suspected, SB_AtRisk, SB_Confirmed
- SVT_Suspected, SVT_AtRisk, SVT_Confirmed

**Purpose**: Detailed statistical reporting

---

#### 12. ClientMessage
**Table**: `ClientMessages`
**Inherits**: `AuditedEntity`

**Fields**:
| Column | Type | Description |
|--------|------|-------------|
| Id | int | Primary key |
| ClientId | int | Foreign key to Client |
| Message | string | Message text |

**Relationships**:
- `Client Client` (Many-to-One)

---

#### 13. ClientPossibleCause
**Table**: `ClientPossibleCauses`
**Inherits**: `AuditedEntity`

**Fields**:
| Column | Type | Description |
|--------|------|-------------|
| Id | int | Primary key |
| ClientId | int | Foreign key to Client |
| PossibleCause | string | Possible cause description |
| Level | string | Severity level |

**Relationships**:
- `Client Client` (Many-to-One)

---

#### 14. Country
**Table**: `Countries`
**Inherits**: `Entity<int>`

**Fields**:
| Column | Type | Description |
|--------|------|-------------|
| Id | int | Primary key |
| EnglishName | string | Country name in English |
| ArabicName | string | Country name in Arabic |
| IsoCode | string | ISO country code (e.g., "US") |
| Flag | string | Flag emoji or URL |
| IsActive | bool | Active status |

**Relationships**:
- `ICollection<Client> Clients` (One-to-Many)

---

#### 15. User (ABP Framework)
**Table**: `AbpUsers`
**Framework**: ABP Zero User entity

**Custom Fields**:
- UserType (string) - e.g., "Physician"

**Relationships**:
- `ICollection<UserMessage> UserMessages` (One-to-Many)

---

#### 16. UserMessage
**Table**: `UserMessages`
**Inherits**: `AuditedEntity`

**Fields**:
| Column | Type | Description |
|--------|------|-------------|
| Id | int | Primary key |
| UserId | long | Foreign key to User |
| Message | string | Message text |

**Relationships**:
- `User User` (Many-to-One)

---

#### 17. Media
**Table**: `Media`
**Inherits**: `AuditedEntity`

**Fields**:
| Column | Type | Description |
|--------|------|-------------|
| Id | int | Primary key |
| Alt | string | Alternative text |

**Purpose**: Media storage (images, files)

---

#### 18. SystemLog
**Table**: `SystemLogs`
**Inherits**: `Entity`

**Fields**:
| Column | Type | Description |
|--------|------|-------------|
| Id | int | Primary key |
| Message | string | Log message |
| MessageTemplate | string | Message template |
| Level | string | Log level (Info/Warning/Error) |
| Timestamp | DateTimeOffset | Log timestamp |
| Exception | string | Exception details |
| Properties | string | XML structured properties |
| LogEvent | string | Log event data |
| RequestBody | string | HTTP request body |
| ResponseBody | string | HTTP response body |

**Purpose**: Application logging and debugging

---

### Database Indexes

Key indexes should be created on:
- `Client.NationalityId`
- `Client.Email` (unique)
- `Client.UserName` (unique)
- `ScanResult.ClientId`
- `ArrhythmiaDetectionRequest.ClientId`
- `ArrhythmiaResult.ArrhythmiaDetectionRequestId`
- `HealthRisk.ScanId`

---

### Migration History

**Location**: `9.4.2/aspnet-core/src/CoreVision.EntityFrameworkCore/Migrations/`

**Recent Notable Migrations**:
- `20250601225000_Add_ArrhythmiaQuestionnaireAnswers` - Added questionnaire tracking
- `20250529144534_Edit_SystemLogs_Add_ResponseBody` - Enhanced logging
- `20250528012055_Edit_ArrhythmiaResult_AddQuestionnaire` - Questionnaire scoring
- `20250522110726_Edit_Client_AddUserType` - User type classification
- `20250519225043_Add_ClientPossibleCause` - Possible causes
- `20250510140328_Add_Arrhythmia` - Initial arrhythmia module

---

## Application Services

### Service Layer Architecture

Application services implement business logic and act as the bridge between API controllers and data repositories.

**Location**: `9.4.2/aspnet-core/src/CoreVision.Application/Services/`

### Service Interfaces

**Location**: `9.4.2/aspnet-core/src/CoreVision.Application/IServices/`

---

### 1. ClientAppService

**File**: `ClientAppService.cs` (lines 25-100+)
**Interface**: `IClientAppService.cs`
**Inherits**: `CoreVisionAppServiceBase`

**Dependencies**:
- `IRepository<Client>` - Client data access
- `IRepository<Country>` - Country reference data
- `IObjectMapper` - AutoMapper for DTO mapping

**Methods**:

#### GetClient(int id)
Retrieves single client with nationality.

**Returns**: `ClientDto`

**Database Operations**:
```csharp
_clientRepository.GetAll()
  .Include(c => c.Nationality)
  .Where(c => c.Id == id)
  .FirstOrDefaultAsync()
```

#### GetClients()
Retrieves all clients.

**Returns**: `List<ClientDto>`

#### AddOrUpdateClient(ClientDto input)
Creates or updates client record.

**Logic**:
- If `input.Id == 0`: Create new client
- Else: Update existing client
- Maps DTO to entity

**Returns**: `ClientDto`

#### AddClientMessages(ClientDto input)
Adds messages to client record.

**Business Logic**:
- Parses messages for possible causes using regex patterns
- Extracts level and cause from message text
- Creates `ClientPossibleCause` entities

**Returns**: `ClientDto`

#### EditClient(ClientDto input)
Updates client demographic and health data.

**Returns**: `ClientDto`

#### EditClientHealthConcern(ClientDto input)
Updates client health concerns specifically.

**Returns**: `ClientDto`

#### GetClientReportPagedAsync(ClientReportQueryOption options)
Advanced filtering and pagination for client reports.

**Query Parameters**:
- `pageNumber`, `pageSize` - Pagination
- `nationality` - Country filter
- `gender` - Gender filter
- `ageGroup` - Age group filter (e.g., "40-50")
- `name` - Name search (partial match)
- `arrhythmiaDetection` - Has arrhythmia results
- `riskStatus` - Risk level filter

**Database Operations**:
```csharp
_clientRepository.GetAll()
  .Include(c => c.Nationality)
  .Include(c => c.ScanResults.OrderByDescending(s => s.CreationTime).Take(1))
  .Include(c => c.ArrhythmiaDetectionRequests)
    .ThenInclude(a => a.ArrhythmiaResults)
  .Where(/* complex filtering */)
  .Select(/* project to DTO */)
  .Skip((pageNumber - 1) * pageSize)
  .Take(pageSize)
```

**Returns**: `PaginatedList<ClientReportDto>`

#### GetClientProfile(int clientId)
Aggregates comprehensive client profile.

**Returns**: `ClientProfileDto` containing:
- Client data
- Nationality
- Latest scan reading
- Possible causes
- Arrhythmia risks

**Database Operations**: Multiple repository calls with includes

---

### 2. ArrhythmiaAppService

**File**: `ArrhythmiaAppService.cs` (lines 30-404)
**Interface**: `IArrhythmiaAppService.cs`
**Inherits**: `CoreVisionAppServiceBase`

**Dependencies**:
- `IRepository<ArrhythmiaDetectionRequest>`
- `IGenericRepository<ArrhythmiaResult>`
- `IRepository<ArrhythmiaSummary>`
- `IRepository<Client>`
- `IConfiguration` - External API configuration
- `ILogger<ArrhythmiaAppService>` - Logging
- `HttpClient` - External API calls

**Configuration Keys**:
```json
{
  "ArrhythmiaService": {
    "BaseUrl": "https://api.arrhythmia-service.com",
    "LoginEndpoint": "/api/login",
    "AnalyzeEndpoint": "/api/analyze",
    "Username": "api_user",
    "Password": "api_password"
  }
}
```

**Methods**:

#### GetArrhythmiaRequest(int clientId)
Get single arrhythmia request for client.

**Returns**: `ArrhythmiaDetectionRequestDto`

#### GetArrhythmiaRequests(int clientId)
Get all arrhythmia requests for client.

**Returns**: `List<ArrhythmiaDetectionRequestDto>`

#### AddArrhythmiaRequest(ArrhythmiaRequestDto input)
Submit ECG data for analysis.

**Business Logic Flow**:
1. Validate input (minimum 100 readings required)
2. Trim to last 100 readings if more provided
3. Authenticate with external API:
   ```csharp
   POST {BaseUrl}{LoginEndpoint}
   Body: { username, password }
   Response: { token }
   ```
4. Call analysis endpoint for each of 9 arrhythmia types:
   ```csharp
   POST {BaseUrl}{AnalyzeEndpoint}
   Headers: Authorization: Bearer {token}
   Body: { inputs: [[...ecg_readings...]] }
   Response: { prediction, confidence, detected }
   ```
5. Calculate `InitialRiskLevel`:
   - Not detected → "Confirmed"
   - Confidence >= 85% → "HighRisk"
   - Otherwise → "Suspected"
6. Create `ArrhythmiaDetectionRequest` entity
7. Create 9 `ArrhythmiaResult` entities
8. Fire background task to update `ArrhythmiaSummary`

**Concurrency Control**:
```csharp
static SemaphoreSlim _semaphore = new SemaphoreSlim(4, 4);
// Maximum 4 concurrent summary updates
```

**Returns**: `ArrhythmiaDetectionRequestDto`

#### GetArrhythmiaSummaries(int? nationality, string gender, string ageGroup)
Get statistical summaries with filtering.

**Query Logic**:
```csharp
_arrhythmiaSummaryRepository.GetAll()
  .Where(s => nationality == null || s.NationalityId == nationality)
  .Where(s => string.IsNullOrEmpty(gender) || s.Gender == gender)
  .Where(s => string.IsNullOrEmpty(ageGroup) || s.AgeGroup == ageGroup)
  .ToListAsync()
```

**Returns**: `List<ArrhythmiaReportDto>`

#### EditArrhythmiasQuestionnaire(EditArrhythmiaQuestionnaireDto input)
Update questionnaire responses.

**Business Logic**:
1. Find `ArrhythmiaResult` by ID
2. Update `QuestionnaireRiskLevel`
3. Update `QuestionnaireScore`
4. Delete existing questionnaire answers
5. Insert new questionnaire answers
6. Fire background task to update summaries

**Returns**: `RequestResult<object>`

#### UpdateArrhythmiaSummaryAsync (Private Background Task)
Updates statistical summaries asynchronously.

**Algorithm**:
1. Acquire semaphore (max 4 concurrent)
2. For each combination of:
   - ArrhythmiaName (9 types)
   - RiskLevel (3 levels)
   - NationalityId
   - Gender
   - AgeGroup
3. Count matching clients:
   ```csharp
   _clientRepository.GetAll()
     .Include(c => c.ArrhythmiaDetectionRequests)
       .ThenInclude(a => a.ArrhythmiaResults)
     .Where(/* match filters */)
     .Count()
   ```
4. Update or insert `ArrhythmiaSummary` record
5. Release semaphore

**Error Handling**: All errors logged, summary update continues

---

### 3. ScanResultAppService

**File**: `ScanResultAppService.cs` (lines 16-84)
**Interface**: `IScanResultAppService.cs`
**Inherits**: `CoreVisionAppServiceBase`

**Dependencies**:
- `IRepository<ScanResult>`
- `IObjectMapper`

**Methods**:

#### GetScanResult(int id)
Get single scan result by ID.

**Database Operations**:
```csharp
_scanResultRepository.GetAll()
  .Include(s => s.HealthRisk)
    .ThenInclude(h => h.CvDisease)
  .Include(s => s.HealthRisk)
    .ThenInclude(h => h.HardAndFatalEvent)
  .Include(s => s.HealthRisk)
    .ThenInclude(h => h.Score)
  .FirstOrDefaultAsync(s => s.Id == id)
```

**Returns**: `ScanResultDto`

#### GetScanResultsByClientId(int clientId)
Get all scan results for a client.

**Ordering**: `OrderByDescending(s => s.CreationTime)`

**Returns**: `List<ScanResultDto>`

#### GetClientLatestScanResult(int clientId)
Get most recent scan for client.

**Returns**: `ScanResultDto`

#### AddScanResult(ScanResultDto input)
Create new scan result.

**Business Logic**:
- Map DTO to entity
- Serialize heart rate intervals to JSON
- Insert into database

**Returns**: `ScanResultDto`

---

### 4. EmailAppService

**File**: `EmailAppService.cs` (lines 15-80+)
**Interface**: `IEmailAppService.cs`
**Inherits**: `CoreVisionAppServiceBase`

**Dependencies**:
- `IConfiguration` - SMTP settings
- `ILogger<EmailAppService>` - Comprehensive logging
- `MailKit.Net.Smtp.SmtpClient` - Email delivery

**Configuration Keys**:
```json
{
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "SenderEmail": "noreply@corevision.com",
    "SenderName": "CoreVision Health",
    "Username": "smtp_user",
    "Password": "smtp_password",
    "UseSsl": true
  }
}
```

**Environment Variable Override**:
- `SMTP_PASSWORD` overrides `EmailSettings:Password`

**Methods**:

#### SendEmail(EmailRequestDto request)
Send plain or HTML email.

**Parameters**:
- `receiver` - Email address
- `subject` - Email subject
- `text` - Email body
- `isHtml` - Content type flag

**SMTP Flow**:
```csharp
using var client = new SmtpClient();
await client.ConnectAsync(smtpServer, port, SecureSocketOptions.StartTls);
await client.AuthenticateAsync(username, password);
await client.SendAsync(message);
await client.DisconnectAsync(true);
```

**Error Handling**:
- `AuthenticationException` - SMTP authentication failure
- `SmtpCommandException` - SMTP protocol errors
- `SmtpProtocolException` - Protocol violations
- `IOException` - Network failures
- Generic exceptions

**Logging**:
- Request ID generation for tracking
- Full request/response logging
- Error logging with stack traces

**Returns**: `RequestResult<object>`

#### SendMedicalReport(MedicalReportEmailRequestDto request)
Generate and send formatted medical report.

**Parameters**:
- `receiver` - Email address
- `subject` - Optional (default: "Health Assessment Report")
- `reportData` - Medical data object

**HTML Generation**:
- Bilingual (English/Arabic) layout
- Color-coded indicators:
  - Normal: Green (#28a745)
  - Elevated: Orange (#ffc107)
  - High: Red (#dc3545)
- Professional medical formatting
- Responsive design
- Tables for vital signs and arrhythmia results

**Report Sections**:
1. Header with logo and title
2. Patient information (name, age, gender, date, time)
3. Vital Signs table
4. Arrhythmia Detection Results table
5. Footer with disclaimer

**Logging**: Request ID tracking for debugging

**Returns**: `RequestResult<object>`

---

### 5. CommonAppService

**File**: `CommonAppService.cs` (lines 14-38)
**Interface**: `ICommonAppService.cs`
**Inherits**: `CoreVisionAppServiceBase`

**Dependencies**:
- `IRepository<Country>`
- `IObjectMapper`

**Methods**:

#### GetCountries()
Get all countries with "All" option prepended.

**Business Logic**:
```csharp
var countries = await _countryRepository.GetAll().ToListAsync();
var result = ObjectMapper.Map<List<CountryDto>>(countries);
result.Insert(0, new CountryDto
{
  Id = 0,
  EnglishName = "All",
  ArabicName = "الكل"
});
return result;
```

**Returns**: `List<CountryDto>`

---

### 6. UserAppService

**File**: `UserAppService.cs`
**Interface**: `IUserAppService`
**Inherits**: `AsyncCrudAppService<User, UserDto, long, ...>`

**Purpose**: Physician user management

**Methods**:

#### GetPhysicians()
Get all users with UserType = "Physician".

**Returns**: `List<UserDto>`

#### CreatePhysicianAsync(CreateUserDto input)
Create new physician user.

**Business Logic**:
- Password hashing
- Set `IsActive = true`
- Set `UserType = "Physician"`
- Assign default roles

**Returns**: `UserDto`

#### UpdatePhysicianAsync(UserDto input)
Update physician user.

**Returns**: `UserDto`

#### DeletePhysician(int userId)
Soft delete physician user.

**Returns**: `RequestResult<object>`

---

### Service Patterns

**Common Patterns Across Services**:

1. **Repository Pattern**: All services use `IRepository<T>` for data access
2. **DTO Mapping**: AutoMapper via `IObjectMapper`
3. **Async/Await**: All database operations are asynchronous
4. **Include Queries**: Eager loading with `.Include()` for related entities
5. **Result Wrapper**: `RequestResult<T>` for consistent API responses
6. **Error Handling**: Try-catch with logging
7. **ABP Framework**: Inherits from `CoreVisionAppServiceBase`

---

## Data Transfer Objects

**Location**: `9.4.2/aspnet-core/src/CoreVision.Application/DTOs/`

### Mapping Attributes

DTOs use AutoMapper attributes:
```csharp
[AutoMapFrom(typeof(Entity))]  // Entity → DTO
[AutoMapTo(typeof(Entity))]    // DTO → Entity
[AutoMap(typeof(Entity))]      // Bidirectional
```

---

### Client DTOs

#### ClientDto
**File**: `ClientDto.cs`
**Maps From**: `Client` entity

**Properties**: (70+ properties)
- All `Client` entity fields
- `Nationality` (string) - Denormalized from Country
- `ClientMessages` (List<ClientMessageDto>)
- `ClientPossibleCauses` (List<ClientPossibleCauseDto>)

#### ClientProfileDto
**File**: `ClientProfileDto.cs`

**Properties**:
```csharp
public ClientDto Client { get; set; }
public string Nationality { get; set; }
public LatestReadingDto LatestReading { get; set; }
public List<ClientPossibleCauseDto> PossibleCauses { get; set; }
public List<ArrhythmiaRiskDto> ArrhythmiaRisks { get; set; }
```

**Purpose**: Aggregated view for client profile page

#### ClientReportDto
**File**: `ClientReportDto.cs`

**Properties**:
```csharp
public int Id { get; set; }
public string FullName { get; set; }
public int Age { get; set; }
public string Gender { get; set; }
public string Nationality { get; set; }
public int? HeartRate { get; set; }
public string BloodPressure { get; set; }
public string RiskCategory { get; set; }
public bool HasArrhythmia { get; set; }
public DateTime? LastScanDate { get; set; }
```

**Purpose**: List view in client report table

#### LatestReadingDto
**File**: `LatestReadingDto.cs`

**Properties**:
```csharp
public int? HeartRate { get; set; }
public string BloodPressure { get; set; }
public decimal? Temperature { get; set; }
public decimal? Glucose { get; set; }
public DateTime? ScanDate { get; set; }
```

#### ClientMessageDto
**Maps From**: `ClientMessage`

**Properties**:
```csharp
public int Id { get; set; }
public int ClientId { get; set; }
public string Message { get; set; }
```

#### ClientPossibleCauseDto
**Maps From**: `ClientPossibleCause`

**Properties**:
```csharp
public int Id { get; set; }
public int ClientId { get; set; }
public string PossibleCause { get; set; }
public string Level { get; set; }
```

---

### Scan Result DTOs

#### ScanResultDto
**File**: `ScanResultDto.cs`
**Maps From**: `ScanResult`

**Properties**:
- All `ScanResult` entity fields
- `HealthRisk` (HealthRiskDto) - Nested DTO

#### HealthRiskDto
**Maps From**: `HealthRisk`

**Properties**:
- All `HealthRisk` entity fields
- `CvDisease` (CvDiseaseDto)
- `HardAndFatalEvent` (HardAndFatalEventDto)
- `Score` (ScoreDto)

#### CvDiseaseDto
**Maps From**: `CvDisease`

**Properties**: All `CvDisease` entity fields

#### HardAndFatalEventDto
**Maps From**: `HardAndFatalEvent`

**Properties**: All `HardAndFatalEvent` entity fields

#### ScoreDto
**Maps From**: `Score`

**Properties**: All `Score` entity fields

---

### Arrhythmia DTOs

#### ArrhythmiaRequestDto
**File**: `ArrhythmiaRequestDto.cs`

**Properties**:
```csharp
public int ClientId { get; set; }
public int? ScanId { get; set; }
public List<List<double>> Inputs { get; set; }  // ECG readings
```

**Validation**:
- `Inputs` must contain at least 100 readings
- Trimmed to last 100 if more provided

#### ArrhythmiaDetectionRequestDto
**Maps From**: `ArrhythmiaDetectionRequest`

**Properties**:
```csharp
public int Id { get; set; }
public int ClientId { get; set; }
public int? ScanId { get; set; }
public Guid RequestId { get; set; }
public DateTime CreationTime { get; set; }
public List<ArrhythmiaResultDto> ArrhythmiaResults { get; set; }
```

#### ArrhythmiaResultDto
**Maps From**: `ArrhythmiaResult`

**Properties**:
```csharp
public int Id { get; set; }
public int ArrhythmiaDetectionRequestId { get; set; }
public string ApiName { get; set; }
public string ArrhythmiaName { get; set; }
public string ArrhythmiaShortName { get; set; }
public decimal? Confidence { get; set; }
public bool Detected { get; set; }
public decimal? Prediction { get; set; }
public string InitialRiskLevel { get; set; }
public string QuestionnaireRiskLevel { get; set; }
public int? QuestionnaireScore { get; set; }
public bool Success { get; set; }
public string ErrorMessage { get; set; }
public List<ArrhythmiaQuestionnaireAnswerDto> QuestionnaireAnswers { get; set; }
```

#### ArrhythmiaQuestionnaireAnswerDto
**Maps From**: `ArrhythmiaQuestionnaireAnswer`

**Properties**:
```csharp
public int Id { get; set; }
public int ArrhythmiaResultId { get; set; }
public int Index { get; set; }
public string Answer { get; set; }
```

#### EditArrhythmiaQuestionnaireDto
**File**: `EditArrhythmiaQuestionnaireDto.cs`

**Properties**:
```csharp
public int ArrhythmiaResultId { get; set; }
public string QuestionnaireRiskLevel { get; set; }
public int? QuestionnaireScore { get; set; }
public List<ArrhythmiaQuestionnaireAnswerDto> QuestionnaireAnswers { get; set; }
```

#### ArrhythmiaReportDto
**Maps From**: `ArrhythmiaSummary`

**Properties**:
```csharp
public string ArrhythmiaName { get; set; }
public string RiskLevel { get; set; }
public int? NationalityId { get; set; }
public string Gender { get; set; }
public string AgeGroup { get; set; }
public int ClientCount { get; set; }
```

---

### Common DTOs

#### CountryDto
**Maps From**: `Country`

**Properties**:
```csharp
public int Id { get; set; }
public string EnglishName { get; set; }
public string ArabicName { get; set; }
public string IsoCode { get; set; }
public string Flag { get; set; }
public bool IsActive { get; set; }
```

#### EmailRequestDto
**File**: `EmailRequestDto.cs`

**Properties**:
```csharp
[Required]
public string Receiver { get; set; }
[Required]
public string Subject { get; set; }
[Required]
public string Text { get; set; }
public bool IsHtml { get; set; }
```

#### MedicalReportEmailRequestDto
**File**: `MedicalReportEmailRequestDto.cs`

**Properties**:
```csharp
[Required]
public string Receiver { get; set; }
public string Subject { get; set; }  // Optional, defaults to "Health Assessment Report"
[Required]
public MedicalReportDto ReportData { get; set; }
```

#### MedicalReportDto
**File**: `MedicalReportDto.cs`

**Properties**:
```csharp
public string PatientName { get; set; }
public int Age { get; set; }
public string Gender { get; set; }
public string Date { get; set; }
public string Time { get; set; }
public int? HeartRate { get; set; }
public int? SystolicBP { get; set; }
public int? DiastolicBP { get; set; }
public decimal? Temperature { get; set; }
public decimal? Glucose { get; set; }
public decimal? Hba1c { get; set; }
public int? OxygenSaturation { get; set; }
public List<ArrhythmiaResultSummary> ArrhythmiaResults { get; set; }
```

#### PaginationDto
**File**: `PaginationDto.cs`

**Properties**:
```csharp
public int PageSize { get; set; } = 20;
public int PageNumber { get; set; } = 1;
```

#### PaginatedList<T>
**File**: `PaginatedList.cs`

**Properties**:
```csharp
public List<T> Items { get; set; }
public int PageNumber { get; set; }
public int TotalPages { get; set; }
public int TotalCount { get; set; }
public bool HasPreviousPage => PageNumber > 1;
public bool HasNextPage => PageNumber < TotalPages;
```

---

### User DTOs (ABP Framework)

#### UserDto
**Maps From**: `User`

**Properties**:
- Standard ABP User properties
- `UserType` (string) - Custom property

#### CreateUserDto
**Properties**:
```csharp
public string UserName { get; set; }
public string Name { get; set; }
public string Surname { get; set; }
public string EmailAddress { get; set; }
public string PhoneNumber { get; set; }
public string Password { get; set; }
public bool IsActive { get; set; }
```

---

## Data Flow & Integration

### Complete Data Flow Examples

#### Flow 1: Patient Health Screening

```
┌─────────────┐
│   Client    │
│ (Kiosk App) │
└──────┬──────┘
       │
       │ 1. Create Client
       ▼
┌─────────────────────────┐
│ POST /api/Client/       │
│ AddOrUpdateClient       │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ ClientAppService        │
│ - Validate input        │
│ - Map DTO to Entity     │
│ - Insert to DB          │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Database: Clients       │
└──────┬──────────────────┘
       │
       │ 2. Record Vital Signs
       ▼
┌─────────────────────────┐
│ POST /api/ScanResult/   │
│ AddScanResult           │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ ScanResultAppService    │
│ - Validate vitals       │
│ - Calculate risks       │
│ - Insert scan + health  │
│   risk + CV disease     │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Database:                           │
│ - ScanResult                        │
│ - HealthRisk                        │
│ - CvDisease, HardAndFatalEvent,     │
│   Score (1-to-1)                    │
└──────┬──────────────────────────────┘
       │
       │ 3. ECG Analysis
       ▼
┌─────────────────────────┐
│ POST /api/Arrhythmia/   │
│ AddArrhythmiaRequest    │
│ Body: { inputs: [[...]] }│
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ ArrhythmiaAppService    │
│ 1. Validate ECG data    │
│ 2. Call external API    │
│    - Login              │
│    - Analyze (9 types)  │
│ 3. Calculate risk       │
│ 4. Store results        │
│ 5. Update summaries     │
└──────┬──────────────────┘
       │
       │ External API Call
       ▼
┌───────────────────────────────────┐
│ External Arrhythmia Service       │
│ POST /api/login                   │
│ Response: { token }               │
│                                   │
│ POST /api/analyze (x9)            │
│ Headers: Authorization: Bearer    │
│ Response: { prediction,           │
│            confidence, detected } │
└──────┬────────────────────────────┘
       │
       │ Store Results
       ▼
┌─────────────────────────────────────┐
│ Database:                           │
│ - ArrhythmiaDetectionRequest        │
│ - ArrhythmiaResult (x9)             │
└──────┬──────────────────────────────┘
       │
       │ Background Task (Fire & Forget)
       ▼
┌─────────────────────────┐
│ UpdateArrhythmiaSummary │
│ - Semaphore control     │
│ - Count by filters      │
│ - Update summaries      │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Database:               │
│ - ArrhythmiaSummary     │
└──────┬──────────────────┘
       │
       │ 4. Generate Report
       ▼
┌─────────────────────────┐
│ POST /api/Email/        │
│ SendMedicalReport       │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ EmailAppService         │
│ 1. Generate HTML        │
│ 2. Color-code vitals    │
│ 3. Send via SMTP        │
└──────┬──────────────────┘
       │
       │ SMTP
       ▼
┌─────────────────────────┐
│ Email Server            │
│ (Gmail, etc.)           │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Patient Email Inbox     │
└─────────────────────────┘
```

---

#### Flow 2: Physician Review

```
┌─────────────┐
│  Physician  │
│ (Web Portal)│
└──────┬──────┘
       │
       │ 1. Login
       ▼
┌─────────────────────────┐
│ POST /api/TokenAuth/    │
│ Authenticate            │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ TokenAuthController     │
│ - Validate credentials  │
│ - Generate JWT          │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Response: { accessToken,│
│   userId, userType }    │
└──────┬──────────────────┘
       │
       │ 2. View Patient List
       ▼
┌─────────────────────────┐
│ POST /api/Client/       │
│ GetClientsReport        │
│ Headers: Authorization  │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ ClientAppService        │
│ - Apply filters         │
│ - Join related data     │
│ - Paginate results      │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Response: Paginated     │
│ list with vitals and    │
│ arrhythmia status       │
└──────┬──────────────────┘
       │
       │ 3. View Patient Profile
       ▼
┌─────────────────────────┐
│ GET /api/Client/        │
│ GetClientProfile        │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ ClientAppService        │
│ - Get client            │
│ - Get latest scan       │
│ - Get arrhythmia risks  │
│ - Aggregate profile     │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Response: Complete      │
│ patient profile with    │
│ history and risks       │
└──────┬──────────────────┘
       │
       │ 4. Review Arrhythmia Results
       ▼
┌─────────────────────────┐
│ GET /api/Arrhythmia/    │
│ GetArrhythmiaRequests   │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ ArrhythmiaAppService    │
│ - Get all requests      │
│ - Include 9 results     │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Response: All arrhythmia│
│ detections with         │
│ confidence scores       │
└──────┬──────────────────┘
       │
       │ 5. Update Risk Assessment
       ▼
┌─────────────────────────┐
│ POST /api/Arrhythmia/   │
│ EditArrhythmiaQuestionnaire│
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ ArrhythmiaAppService    │
│ - Update risk level     │
│ - Update questionnaire  │
│ - Trigger summary update│
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Database:               │
│ - ArrhythmiaResult      │
│ - QuestionnaireAnswers  │
│ - ArrhythmiaSummary     │
└─────────────────────────┘
```

---

### External Integrations

#### 1. Arrhythmia Detection API

**Purpose**: AI-powered ECG analysis for 9 arrhythmia types

**Base URL**: Configured in `appsettings.json`

**Authentication Flow**:
```
POST {BaseUrl}/api/login
Content-Type: application/json

{
  "username": "api_user",
  "password": "api_password"
}

Response:
{
  "token": "bearer_token_string",
  "expiresIn": 3600
}
```

**Analysis Endpoint**:
```
POST {BaseUrl}/api/analyze/{arrhythmia_type}
Authorization: Bearer {token}
Content-Type: application/json

{
  "inputs": [
    [0.5, 0.6, 0.7, ...] // 100 ECG readings
  ]
}

Response:
{
  "prediction": 0.925,
  "confidence": 92.5,
  "detected": true,
  "arrhythmiaType": "Atrial Fibrillation"
}
```

**Arrhythmia Types** (9 endpoints):
1. `/api/analyze/afib` - Atrial Fibrillation
2. `/api/analyze/aflut` - Atrial Flutter
3. `/api/analyze/apnea` - Sleep Apnea
4. `/api/analyze/chf` - Congestive Heart Failure
5. `/api/analyze/hblock` - Heart Block
6. `/api/analyze/mi` - Myocardial Infarction
7. `/api/analyze/pvcs` - Premature Ventricular Contractions
8. `/api/analyze/sb` - Sinus Bradycardia
9. `/api/analyze/svt` - Supraventricular Tachycardia

**Error Handling**:
- Network errors: Retry with exponential backoff
- Authentication errors: Re-authenticate and retry once
- API errors: Store error message in `ArrhythmiaResult.ErrorMessage`

**Rate Limiting**: Implement client-side throttling if needed

---

#### 2. SMTP Email Service

**Purpose**: Medical report delivery

**Configuration**:
```json
{
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "SenderEmail": "noreply@corevision.com",
    "SenderName": "CoreVision Health",
    "Username": "smtp_user",
    "Password": "smtp_password",
    "UseSsl": true
  }
}
```

**Environment Variables** (override config):
- `SMTP_PASSWORD` - SMTP password

**Connection Flow**:
```csharp
var client = new SmtpClient();
await client.ConnectAsync(smtpServer, port, SecureSocketOptions.StartTls);
await client.AuthenticateAsync(username, password);

var message = new MimeMessage();
message.From.Add(new MailboxAddress(senderName, senderEmail));
message.To.Add(new MailboxAddress("", receiverEmail));
message.Subject = subject;
message.Body = new TextPart(isHtml ? "html" : "plain") { Text = body };

await client.SendAsync(message);
await client.DisconnectAsync(true);
```

**Common Providers**:
- **Gmail**: `smtp.gmail.com:587` (requires app-specific password)
- **SendGrid**: `smtp.sendgrid.net:587`
- **Mailgun**: `smtp.mailgun.org:587`
- **Office365**: `smtp.office365.com:587`

**Error Codes**:
- 535: Authentication failed
- 550: Mailbox unavailable
- 552: Exceeded storage allocation
- 554: Transaction failed

---

### Background Tasks

#### ArrhythmiaSummary Update Task

**Trigger**: After arrhythmia detection or questionnaire update

**Implementation**:
```csharp
Task.Run(async () => await UpdateArrhythmiaSummaryAsync(...));
```

**Concurrency Control**:
```csharp
static SemaphoreSlim _semaphore = new SemaphoreSlim(4, 4);
// Maximum 4 concurrent updates
```

**Algorithm**:
1. For each combination:
   - ArrhythmiaName (9 types)
   - RiskLevel (3 levels: Suspected, HighRisk, Confirmed)
   - NationalityId
   - Gender
   - AgeGroup
2. Query database for matching client count
3. Update or insert `ArrhythmiaSummary` record

**Performance**: Async execution prevents API blocking

---

## Security & Authentication

### JWT Token Authentication

**Token Generation** (`TokenAuthController.cs`):

```csharp
var claims = new[]
{
    new Claim(JwtRegisteredClaimNames.Sub, user.UserName),
    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
    new Claim(JwtRegisteredClaimNames.Iat, DateTime.UtcNow.ToString()),
    new Claim("userId", user.Id.ToString()),
    new Claim("userType", user.UserType)
};

var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

var token = new JwtSecurityToken(
    issuer: "CoreVision",
    audience: "CoreVisionUsers",
    claims: claims,
    expires: DateTime.UtcNow.AddHours(1),
    signingCredentials: credentials
);

var accessToken = new JwtSecurityTokenHandler().WriteToken(token);
```

**Token Validation** (`Startup.cs`):

```csharp
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "CoreVision",
            ValidAudience = "CoreVisionUsers",
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(secretKey))
        };
    });
```

**Token Usage**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Expiration**: 1 hour (3600 seconds)

---

### Authorization

**Controller Authorization**:
```csharp
[Authorize]
[Route("api/[controller]/[action]")]
public class ClientController : CoreVisionControllerBase
```

**ABP Permissions**:
- Based on roles and permissions
- Configured in `CoreVisionAuthorizationProvider.cs`

**Common Roles**:
- Admin
- Physician
- Staff

---

### CORS Configuration

**File**: `Startup.cs`

```csharp
services.AddCors(options =>
{
    options.AddPolicy("localhost", builder =>
    {
        builder
            .WithOrigins("http://localhost:4200", "http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

app.UseCors("localhost");
```

**Production**: Configure specific origins, avoid `AllowAnyOrigin()` with credentials

---

### Data Protection

**Password Hashing**: ABP Framework default (PBKDF2)

**Sensitive Data**:
- SMTP password stored in environment variables
- External API credentials in configuration (should use Key Vault in production)

**HTTPS**: Required in production

**SQL Injection Protection**: Entity Framework parameterized queries

---

## Configuration

### appsettings.json

**Location**: `9.4.2/aspnet-core/src/CoreVision.Web.Host/appsettings.json`

```json
{
  "ConnectionStrings": {
    "Default": "Server=localhost;Database=CoreVisionDb;Trusted_Connection=True;"
  },
  "App": {
    "ServerRootAddress": "http://localhost:5000/",
    "ClientRootAddress": "http://localhost:4200/",
    "CorsOrigins": "http://localhost:4200,http://localhost:3000"
  },
  "Authentication": {
    "JwtBearer": {
      "IsEnabled": "true",
      "SecurityKey": "CoreVision_8CFB2EC534E14D56",
      "Issuer": "CoreVision",
      "Audience": "CoreVisionUsers"
    }
  },
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "SenderEmail": "noreply@corevision.com",
    "SenderName": "CoreVision Health",
    "Username": "smtp_user",
    "Password": "smtp_password",
    "UseSsl": true
  },
  "ArrhythmiaService": {
    "BaseUrl": "https://api.arrhythmia-service.com",
    "LoginEndpoint": "/api/login",
    "AnalyzeEndpoint": "/api/analyze",
    "Username": "api_user",
    "Password": "api_password"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning"
    }
  }
}
```

---

### Environment Variables

**Override Configuration**:
- `SMTP_PASSWORD` - SMTP password
- `ASPNETCORE_ENVIRONMENT` - Environment (Development/Staging/Production)
- `ASPNETCORE_URLS` - Listening URLs

**Example**:
```bash
export SMTP_PASSWORD="secure_password"
export ASPNETCORE_ENVIRONMENT="Production"
export ASPNETCORE_URLS="http://0.0.0.0:5000"
```

---

### Database Connection String

**Development**:
```
Server=localhost;Database=CoreVisionDb;Trusted_Connection=True;
```

**Production** (Example):
```
Server=prod-server.database.windows.net;Database=CoreVisionDb;User Id=dbuser;Password=dbpassword;Encrypt=True;
```

---

### Logging Configuration

**File**: `log4net.config`

```xml
<log4net>
  <appender name="RollingFileAppender" type="log4net.Appender.RollingFileAppender">
    <file value="App_Data/Logs/Logs.txt" />
    <appendToFile value="true" />
    <rollingStyle value="Size" />
    <maxSizeRollBackups value="10" />
    <maximumFileSize value="10MB" />
    <staticLogFileName value="true" />
    <layout type="log4net.Layout.PatternLayout">
      <conversionPattern value="%-5level %date [%-5.5thread] %-40.40logger - %message%newline" />
    </layout>
  </appender>
  <root>
    <level value="INFO" />
    <appender-ref ref="RollingFileAppender" />
  </root>
</log4net>
```

**Serilog** (alternative):
- Structured logging
- Outputs to: Console, File, Database (SystemLog table)

---

## Development Guide

### Prerequisites

- .NET 6.0+ SDK
- SQL Server 2016+ (or Azure SQL)
- Visual Studio 2022 or VS Code
- Node.js (for frontend, if applicable)

---

### Setup Instructions

#### 1. Clone Repository
```bash
git clone <repository-url>
cd Kiosk-BE2/9.4.2/aspnet-core
```

#### 2. Restore NuGet Packages
```bash
dotnet restore
```

#### 3. Update Database Connection
Edit `src/CoreVision.Web.Host/appsettings.json`:
```json
"ConnectionStrings": {
  "Default": "Server=YOUR_SERVER;Database=CoreVisionDb;User Id=YOUR_USER;Password=YOUR_PASSWORD;"
}
```

#### 4. Run Migrations
```bash
cd src/CoreVision.Web.Host
dotnet ef database update
```

#### 5. Configure External Services

**Email Settings**:
```json
"EmailSettings": {
  "SmtpServer": "smtp.gmail.com",
  "SmtpPort": 587,
  "Username": "your_email@gmail.com",
  "Password": "your_app_password"
}
```

**Arrhythmia Service**:
```json
"ArrhythmiaService": {
  "BaseUrl": "https://your-arrhythmia-api.com",
  "Username": "api_username",
  "Password": "api_password"
}
```

#### 6. Run Application
```bash
dotnet run --project src/CoreVision.Web.Host
```

Application will start on: `http://localhost:5000`

#### 7. Test API
```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/TokenAuth/Authenticate \
  -H "Content-Type: application/json" \
  -d '{"userNameOrEmailAddress":"admin","password":"123qwe"}'
```

---

### Running Migrations

**Create New Migration**:
```bash
cd src/CoreVision.EntityFrameworkCore
dotnet ef migrations add YourMigrationName --startup-project ../CoreVision.Web.Host
```

**Update Database**:
```bash
dotnet ef database update --startup-project ../CoreVision.Web.Host
```

**Rollback Migration**:
```bash
dotnet ef database update PreviousMigrationName --startup-project ../CoreVision.Web.Host
```

---

### Adding New Entity

1. **Create Entity** in `CoreVision.Core/Entities/`:
```csharp
public class NewEntity : AuditedEntity
{
    public string Name { get; set; }
    public int ClientId { get; set; }
    public virtual Client Client { get; set; }
}
```

2. **Add to DbContext** in `CoreVisionDbContext.cs`:
```csharp
public DbSet<NewEntity> NewEntities { get; set; }
```

3. **Create Configuration** in `EntityConfigurations/`:
```csharp
public class NewEntityConfiguration : IEntityTypeConfiguration<NewEntity>
{
    public void Configure(EntityTypeBuilder<NewEntity> builder)
    {
        builder.ToTable("NewEntities");
        builder.HasOne(e => e.Client)
               .WithMany()
               .HasForeignKey(e => e.ClientId);
    }
}
```

4. **Create DTO** in `CoreVision.Application/DTOs/`:
```csharp
[AutoMapFrom(typeof(NewEntity))]
public class NewEntityDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public int ClientId { get; set; }
}
```

5. **Create AppService**:
```csharp
public class NewEntityAppService : CoreVisionAppServiceBase, INewEntityAppService
{
    private readonly IRepository<NewEntity> _repository;

    public NewEntityAppService(IRepository<NewEntity> repository)
    {
        _repository = repository;
    }

    public async Task<NewEntityDto> GetAsync(int id)
    {
        var entity = await _repository.GetAsync(id);
        return ObjectMapper.Map<NewEntityDto>(entity);
    }
}
```

6. **Create Controller**:
```csharp
[Route("api/[controller]/[action]")]
public class NewEntityController : CoreVisionControllerBase
{
    private readonly INewEntityAppService _service;

    public NewEntityController(INewEntityAppService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<NewEntityDto> Get(int id)
    {
        return await _service.GetAsync(id);
    }
}
```

7. **Run Migration**:
```bash
dotnet ef migrations add AddNewEntity
dotnet ef database update
```

---

### Testing

**Unit Tests** (recommended):
- Create tests in `CoreVision.Tests` project
- Use xUnit or NUnit
- Mock repositories with Moq

**Integration Tests**:
- Test API endpoints
- Use TestServer from `Microsoft.AspNetCore.TestHost`

**Manual Testing**:
- Use Postman or Swagger UI
- Swagger available at: `http://localhost:5000/swagger`

---

### Deployment

#### Database Deployment
1. Generate SQL script from migrations:
```bash
dotnet ef migrations script --output migration.sql
```
2. Review and run script on production database

#### Application Deployment
1. Publish application:
```bash
dotnet publish -c Release -o ./publish
```
2. Copy `publish` folder to server
3. Configure IIS or reverse proxy (nginx)
4. Set environment variables
5. Run application

#### Docker Deployment (Optional)
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "CoreVision.Web.Host.dll"]
```

---

### Troubleshooting

**Common Issues**:

1. **Database Connection Failed**:
   - Check connection string
   - Verify SQL Server is running
   - Check firewall rules

2. **External API Authentication Failed**:
   - Verify credentials in `appsettings.json`
   - Check API endpoint URLs
   - Review logs for detailed error messages

3. **Email Sending Failed**:
   - Verify SMTP settings
   - Check SMTP_PASSWORD environment variable
   - Enable "Less secure app access" for Gmail
   - Use app-specific password for Gmail

4. **JWT Token Invalid**:
   - Check token expiration
   - Verify SecurityKey matches between token generation and validation
   - Ensure clocks are synchronized

5. **CORS Errors**:
   - Add client origin to `CorsOrigins` in `appsettings.json`
   - Restart application after configuration change

---

### Logging and Monitoring

**Application Logs**:
- Location: `App_Data/Logs/Logs.txt`
- Format: log4net pattern layout
- Rotation: 10MB files, 10 backups

**Database Logs**:
- Table: `SystemLogs`
- Contains: Request/Response bodies, exceptions, structured properties

**Email Logs**:
- Every email send attempt logged with request ID
- Includes success/failure status and error messages

**Monitoring Recommendations**:
- Application Insights (Azure)
- Serilog with Elasticsearch/Kibana
- Health check endpoints

---

## API Quick Reference

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/TokenAuth/Authenticate` | POST | User login | No |
| `/api/Client/GetClient` | GET | Get client details | Yes |
| `/api/Client/GetClientsReport` | POST | Get client list (paginated) | Yes |
| `/api/Client/GetClientProfile` | GET | Get client profile | Yes |
| `/api/Client/AddOrUpdateClient` | POST | Create/update client | Yes |
| `/api/ScanResult/GetClientLatestScanResult` | GET | Get latest scan | Yes |
| `/api/ScanResult/AddScanResult` | POST | Create scan result | Yes |
| `/api/Arrhythmia/AddArrhythmiaRequest` | POST | Analyze ECG | Yes |
| `/api/Arrhythmia/GetArrhythmiaRequests` | GET | Get arrhythmia results | Yes |
| `/api/Arrhythmia/EditArrhythmiaQuestionnaire` | POST | Update questionnaire | Yes |
| `/api/Email/SendMedicalReport` | POST | Send medical report | Yes |
| `/api/Common/GetCountries` | GET | Get country list | Yes |
| `/api/User/GetPhysicians` | GET | Get physician list | Yes |
| `/api/PaymentStatus/GetStatus` | GET | Get payment status | Yes |

---

## Database Tables Quick Reference

| Table | Primary Key | Foreign Keys | Purpose |
|-------|-------------|--------------|---------|
| `Clients` | Id (int) | NationalityId → Countries | Patient/client data |
| `ScanResults` | Id (int) | ClientId → Clients | Vital signs measurements |
| `HealthRisks` | Id (int) | ScanId → ScanResults | Risk assessments |
| `CvDiseases` | Id (int) | HealthRiskId → HealthRisks | CV disease risks |
| `HardAndFatalEvents` | Id (int) | HealthRiskId → HealthRisks | Fatal event risks |
| `Scores` | Id (int) | HealthRiskId → HealthRisks | Risk scores |
| `ArrhythmiaDetectionRequests` | Id (int) | ClientId → Clients | ECG analysis requests |
| `ArrhythmiaResults` | Id (int) | ArrhythmiaDetectionRequestId | Detection results |
| `ArrhythmiaQuestionnaireAnswers` | Id (int) | ArrhythmiaResultId | Questionnaire data |
| `ArrhythmiaSummaries` | Id (int) | NationalityId → Countries | Statistical summaries |
| `ClientMessages` | Id (int) | ClientId → Clients | Client messages |
| `ClientPossibleCauses` | Id (int) | ClientId → Clients | Possible medical causes |
| `Countries` | Id (int) | - | Country reference data |
| `SystemLogs` | Id (int) | - | Application logs |

---

## Version History

- **v1.0** (2025-05-10): Initial arrhythmia module
- **v1.1** (2025-05-16): Arrhythmia enhancements
- **v1.2** (2025-05-19): Client SPO2 and possible causes
- **v1.3** (2025-05-22): User type classification
- **v1.4** (2025-05-28): Arrhythmia questionnaire scoring
- **v1.5** (2025-05-29): Enhanced system logging
- **v1.6** (2025-06-01): Questionnaire answer tracking

---

## Support and Maintenance

**Documentation Updates**: This file should be updated when:
- New API endpoints are added
- Database schema changes
- External integrations are modified
- Configuration requirements change

**Contact**:
- Development Team: [development@corevision.com]
- Support: [support@corevision.com]

---

*Document Version: 1.0*
*Last Updated: 2025-10-15*
*Generated by: Claude Code Documentation Generator*
