# Kiosk Backend - CareVision Health Assessment System

## Project Overview

**CareVision** is a comprehensive health assessment kiosk backend system built on ASP.NET Core with ABP Framework (ASP.NET Boilerplate). The system provides health vitals monitoring, arrhythmia detection, medical reporting, and patient management capabilities for health assessment kiosks.

### Technology Stack
- **Framework**: ASP.NET Core 9.0
- **Architecture Pattern**: ABP Framework 9.4.1 (Multi-tenant, Domain-Driven Design)
- **Database**: Azure SQL Database (SQL Server)
- **ORM**: Entity Framework Core 8.0.8
- **Authentication**: JWT Bearer Token
- **Email Services**: MailKit + Resend API
- **Logging**: Serilog (File + SQL Server)
- **API Documentation**: Swagger/OpenAPI

### Target Framework
- .NET 9.0

---

## Solution Architecture

### Project Structure

The solution follows ABP Framework's layered architecture:

```
CoreVision.sln
├── src/
│   ├── CoreVision.Core                    # Domain Layer (Entities, Enums)
│   ├── CoreVision.Application             # Application Layer (Services, DTOs)
│   ├── CoreVision.EntityFrameworkCore     # Data Access Layer (DbContext, Repositories)
│   ├── CoreVision.Web.Core                # Web Core (Controllers, Common Web Logic)
│   ├── CoreVision.Web.Host                # API Host (Startup, Configuration)
│   ├── CoreVision.Web.Mvc                 # MVC Web Application
│   └── CoreVision.Migrator                # Database Migration Tool
└── test/
    ├── CoreVision.Tests                   # Unit Tests
    └── CoreVision.Web.Tests               # Integration Tests
```

### Key Projects

#### 1. **CoreVision.Core**
- **Purpose**: Domain entities and business logic
- **Dependencies**:
  - Abp.AspNetCore 9.4.1
  - Abp.AutoMapper 9.4.1
  - Abp.ZeroCore.EntityFrameworkCore 9.4.1

#### 2. **CoreVision.Application**
- **Purpose**: Application services, business logic orchestration
- **Dependencies**:
  - CoreVision.Core
  - MailKit 4.12.0
  - MimeKit 4.12.0
  - Resend 0.1.5

#### 3. **CoreVision.EntityFrameworkCore**
- **Purpose**: Database context, repositories, migrations
- **Database Provider**: SQL Server (Azure)

#### 4. **CoreVision.Web.Host**
- **Purpose**: RESTful API host
- **Dependencies**:
  - CoreVision.Web.Core
  - Serilog.AspNetCore 8.0.3
  - Serilog.Sinks.File 7.0.0
  - Serilog.Sinks.MSSqlServer 8.2.0

#### 5. **CoreVision.Web.Core**
- **Purpose**: Shared web layer components, API controllers

---

## Database Architecture

### Connection String
```
Server: healthcheckkiosk-db-srv.database.windows.net
Database: HealthCheckDb-Kiosk
Provider: Azure SQL Database
```

### Entity Relationship Diagram

#### Core Entities

**1. Client** (Patient/User)
```csharp
- Id: int (PK)
- UserName: string
- Email: string
- FullName: string
- Phone: string
- Age: int
- Gender: Gender (enum)
- NationalityId: int (FK → Country)

// Health Information
- HealthConcern: string
- HeartRate: int
- BloodPressure: string
- Temperature: double
- OxygonSaturation: string
- ReportedSymptoms: string
- SPO2: double?
- Height: double?
- Weight: double?
- Waist: double?
- BMIStatus: string

// Health Assessment Scores
- MiaHealthScore: string
- SleepScore: double?
- SleepQuality: double?
- PHQ9Score: double?

// Medical History
- CurrentMedication: string
- MedicalConditions: string
- MedicalHistory: string
- SuspectedMedicalConditions: string
- FamilyHistory: string
- Diabetes: string
- PregnancyComplications: string
- Hypertension: string
- MentalHealth: string

// Lifestyle
- ActivityLevel: string
- Pregnant: bool
- Smoker: bool
- PregnancyAge: int
- LMP: string

// Demographics
- Race: string
- State: string
- Provider: string
- Product: string
- Devices: string
- Active: bool

// Relationships
- Nationality: Country
- ScanResults: ICollection<ScanResult>
- PossibleCauses: ICollection<ClientPossibleCause>
- Messages: ICollection<ClientMessage>
- ArrhythmiaDetectionRequests: ICollection<ArrhythmiaDetectionRequest>
```

**2. ScanResult** (Health Vitals Measurements)
```csharp
- Id: int (PK)
- ClientId: int (FK → Client)
- Timestamp: DateTime

// Cardiovascular Metrics
- HeartRate10s: double?
- HeartRate4s: double?
- RealTimeHeartRate: double?
- HrvSdnn: double?
- HrvSdnnMs: double?
- CardiacStress: double?

// Blood Pressure
- SystolicBloodPressure: double?
- DiastolicBloodPressure: double?
- SystolicBloodPressureMmhg: double?
- DiastolicBloodPressureMmhg: double?

// Other Vitals
- BreathingRate: double?
- Temperature: double?
- Glucose: double?
- Hba1c: double?
- HRIntervals: string

// Relationships
- Client: Client
- HealthRisks: HealthRisk
```

**3. HealthRisk** (Risk Assessment Metrics)
```csharp
- Id: int (PK)
- ScanId: int (FK → ScanResult)

// Body Composition Indices
- ABodyShapeIndex: double?
- BasalMetabolicRate: double?
- BodyFatPercentage: double?
- BodyRoundnessIndex: double?
- ConicityIndex: double?
- WaistToHeightRatio: double?

// Health Risk Scores
- DiabetesRisk: double?
- HypertensionRisk: double?
- NonAlcoholicFattyLiverDiseaseRisk: double?
- VascularAge: double?
- WellnessScore: double?

// Energy Expenditure
- TotalDailyEnergyExpenditure: double?

// Relationships
- ScanResult: ScanResult
- CvDiseases: CvDisease
- HardAndFatalEvents: HardAndFatalEvent
- Scores: Score
```

**4. ArrhythmiaDetectionRequest**
```csharp
- Id: int (PK)
- ClientId: int (FK → Client)
- ScanId: int
- RequestId: string (External API request ID)

// Relationships
- Client: Client
- ArrhythmiaResults: ICollection<ArrhythmiaResult>
```

**5. ArrhythmiaResult** (Arrhythmia Detection Results)
```csharp
- Id: int (PK)
- DetectionRequestId: int (FK → ArrhythmiaDetectionRequest)
- RequestId: string

// Detection Details
- ApiName: string (max 100)
- ArrhythmiaName: string
- ArrhythmiaShortName: string
- Confidence: double
- Detected: bool
- Prediction: string
- Success: bool
- ErrorMessage: string

// Risk Assessment
- InitialRiskLevel: RiskLevel (enum)
- QuestionnaireRiskLevel: RiskLevel (enum)
- QuestionnaireScore: int

// Relationships
- DetectionRequest: ArrhythmiaDetectionRequest
- Answers: ICollection<ArrhythmiaQuestionnaireAnswer>
```

**6. ArrhythmiaReport** (Statistical Reports)
```csharp
- Id: int (PK)
- CountryId: int
- Gender: Gender (enum)
- AgeGroup: string

// Statistics per Arrhythmia Type (Suspected/AtRisk/Confirmed)
// AFIB (Atrial Fibrillation)
- AFIBSuspected: int
- AFIBAtRisk: int
- AFIBConfirmed: int

// AFLUT (Atrial Flutter)
- AFLUTSuspected: int
- AFLUTAtRisk: int
- AFLUTConfirmed: int

// APNEA (Sleep Apnea)
- APNEASuspected: int
- APNEAAtRisk: int
- APNEAConfirmed: int

// CHF (Congestive Heart Failure)
- CHFSuspected: int
- CHFAtRisk: int
- CHFConfirmed: int

// HBLOCK (Heart Block)
- HBLOCKSuspected: int
- HBLOCKAtRisk: int
- HBLOCKConfirmed: int

// MI (Myocardial Infarction)
- MISuspected: int
- MIAtRisk: int
- MIConfirmed: int

// PVCs (Premature Ventricular Contractions)
- PVCsSuspected: int
- PVCsAtRisk: int
- PVCsConfirmed: int

// SB (Sinus Bradycardia)
- SBSuspected: int
- SBAtRisk: int
- SBConfirmed: int

// SVT (Supraventricular Tachycardia)
- SVTSuspected: int
- SVTAtRisk: int
- SVTConfirmed: int
```

**7. Supporting Entities**
- **Country**: Nationality reference data
- **ClientMessage**: Messages/notifications for clients
- **ClientPossibleCause**: Possible causes for health conditions
- **UserMessage**: System messages for users
- **Media**: Media files storage
- **CvDisease**: Cardiovascular disease details
- **HardAndFatalEvent**: Serious health event tracking
- **Score**: Various health scoring metrics
- **ArrhythmiaQuestionnaireAnswer**: Questionnaire responses
- **ArrhythmiaSummary**: Aggregated arrhythmia statistics
- **SystemLog**: Application logging

### Enumerations

```csharp
public enum Gender { Male = 1, Female = 2 }

public enum RiskLevel
{
    Suspected = 1,
    AtRisk = 2,
    Confirmed = 3
}

public enum UserType
{
    Admin = 1,
    Physician = 2,
    Patient = 3
}
```

---

## API Endpoints

### Base URL Structure
```
https://your-domain.com/api/[controller]/[action]
```

### Authentication
All endpoints (except authentication) require JWT Bearer token:
```http
Authorization: Bearer {jwt_token}
```

---

### 1. Authentication Controller (`TokenAuthController`)

#### **POST** `/api/TokenAuth/Authenticate`
Authenticate user and obtain JWT token

**Request Body:**
```json
{
  "userNameOrEmailAddress": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "accessToken": "string",
  "encryptedAccessToken": "string",
  "expireInSeconds": 0,
  "userId": 0,
  "userType": "string"
}
```

**Security Configuration:**
- Issuer: CoreVision
- Audience: CoreVision
- SecurityKey: CoreVision_B9DB6D6750C44085A0F20F3DD66F3FF3

---

### 2. Client Controller (`ClientController`)

#### **GET** `/api/Client/GetClient`
Get client by ID

**Query Parameters:**
- `id` (int): Client ID

**Response:**
```json
{
  "isSuccess": true,
  "message": "string",
  "result": { /* ClientDto */ }
}
```

#### **GET** `/api/Client/GetClients`
Get all clients

**Response:**
```json
{
  "isSuccess": true,
  "result": [ /* Array of ClientDto */ ]
}
```

#### **POST** `/api/Client/AddOrUpdateClient`
Create or update client

**Request Body:** `ClientDto`

#### **POST** `/api/Client/AddClientMessages`
Add messages for client

**Request Body:** `ClientDto`

#### **POST** `/api/Client/EditClient`
Edit existing client

**Request Body:** `ClientDto`

#### **POST** `/api/Client/EditClientHealthConcern`
Update client's health concerns

**Request Body:** `ClientDto`

#### **POST** `/api/Client/GetClientsReport`
Get paginated client report with filters

**Request Body:**
```json
{
  "nationalityId": 0,
  "ageGroup": "string",
  "gender": 1,
  "clientName": "string",
  "arrhythmiaName": "string",
  "atRisk": false,
  "pageNumber": 1,
  "pageSize": 10
}
```

**Response:**
```json
{
  "isSuccess": true,
  "result": {
    "items": [
      {
        "clientId": 0,
        "clientName": "string",
        "email": "string",
        "lastVitalsReading": "2025-01-01T00:00:00",
        "heartRate": 0,
        "bloodPressure": "string",
        "heartRateVariability": 0,
        "respirationRate": 0,
        "arrhythmiaResults": []
      }
    ],
    "pageNumber": 1,
    "pageSize": 10,
    "totalPages": 0,
    "totalCount": 0
  }
}
```

#### **GET** `/api/Client/GetClientProfile`
Get detailed client profile

**Query Parameters:**
- `clientId` (int)

---

### 3. Scan Result Controller (`ScanResultController`)

#### **GET** `/api/ScanResult/GetClientLatestScanResult`
Get latest scan result for client

**Query Parameters:**
- `clientId` (int)

**Response:**
```json
{
  "isSuccess": true,
  "result": {
    "id": 0,
    "clientId": 0,
    "timestamp": "2025-01-01T00:00:00",
    "heartRate10s": 0,
    "realTimeHeartRate": 0,
    "hrvSdnnMs": 0,
    "cardiacStress": 0,
    "systolicBloodPressureMmhg": 0,
    "diastolicBloodPressureMmhg": 0,
    "breathingRate": 0,
    "temperature": 0,
    "glucose": 0,
    "hba1c": 0,
    "healthRisks": { /* HealthRiskDto */ }
  }
}
```

#### **GET** `/api/ScanResult/GetScanResultsByClientId`
Get all scan results for client

**Query Parameters:**
- `clientId` (int)

#### **POST** `/api/ScanResult/AddScanResult`
Add new scan result

**Request Body:** `ScanResultDto`

---

### 4. Arrhythmia Controller (`ArrhythmiaController`)

#### **GET** `/api/Arrhythmia/GetArrhythmiaRequest`
Get arrhythmia detection request for client

**Query Parameters:**
- `clientId` (int)

**Response:**
```json
{
  "isSuccess": true,
  "result": {
    "clientId": 0,
    "scanId": 0,
    "requestId": "string",
    "arrhythmiaResults": [
      {
        "arrhythmiaName": "string",
        "arrhythmiaShortName": "string",
        "confidence": 0.95,
        "detected": true,
        "initialRiskLevel": 1,
        "questionnaireRiskLevel": 2,
        "questionnaireScore": 0
      }
    ]
  }
}
```

#### **GET** `/api/Arrhythmia/GetArrhythmiaRequests`
Get all arrhythmia results for client

**Query Parameters:**
- `clientId` (int)

#### **POST** `/api/Arrhythmia/AddArrhythmiaRequest`
Submit new arrhythmia detection request

**Request Body:**
```json
{
  "clientId": 0,
  "scanId": 0,
  "hrIntervals": "string"
}
```

**Process Flow:**
1. Authenticates with external arrhythmia detection API
2. Submits HR intervals for analysis
3. Receives detection results for multiple arrhythmia types
4. Stores results in database
5. Returns detection summary

#### **GET** `/api/Arrhythmia/GetArrhythmiaSummaries`
Get aggregated arrhythmia statistics

**Query Parameters:**
- `nationalityId` (int?)
- `gender` (Gender?)
- `ageGroup` (string)

**Response:**
```json
{
  "isSuccess": true,
  "result": {
    "AFIB": { "suspected": 0, "atRisk": 0, "confirmed": 0 },
    "AFLUT": { "suspected": 0, "atRisk": 0, "confirmed": 0 },
    "APNEA": { "suspected": 0, "atRisk": 0, "confirmed": 0 },
    "CHF": { "suspected": 0, "atRisk": 0, "confirmed": 0 },
    "HBLOCK": { "suspected": 0, "atRisk": 0, "confirmed": 0 },
    "MI": { "suspected": 0, "atRisk": 0, "confirmed": 0 },
    "PVCs": { "suspected": 0, "atRisk": 0, "confirmed": 0 },
    "SB": { "suspected": 0, "atRisk": 0, "confirmed": 0 },
    "SVT": { "suspected": 0, "atRisk": 0, "confirmed": 0 }
  }
}
```

#### **POST** `/api/Arrhythmia/EditArrhythmiaQuestionnaire`
Edit arrhythmia questionnaire responses

**Request Body:**
```json
{
  "arrhythmiaResultId": 0,
  "answers": [
    {
      "questionId": 0,
      "answer": "string",
      "score": 0
    }
  ]
}
```

---

### 5. Email Controller (`EmailController`)

#### **POST** `/api/Email/SendEmail`
Send generic email

**Request Body:**
```json
{
  "receiver": "email@example.com",
  "subject": "string",
  "text": "string",
  "isHtml": false
}
```

#### **POST** `/api/Email/SendMedicalReport`
Send formatted medical report via email

**Request Body:**
```json
{
  "receiver": "email@example.com",
  "subject": "Health Assessment Summary",
  "reportData": {
    "date": "12/09/2025",
    "time": "17:01:08",
    "name": "Patient Name",
    "age": 30,
    "gender": "Male",
    "heartRate": 75,
    "bloodPressure": "120/80",
    "heartRateVariability": 45,
    "respirationRate": 16,
    "reportedSymptoms": "None"
  }
}
```

**Email Service Priority:**
1. **Resend API** (if `RESEND_APITOKEN` configured) - Primary
2. **SMTP** (Office 365) - Fallback

**Response:**
```json
{
  "isSuccess": true,
  "message": "Email sent successfully"
}
```

---

### 6. User Controller (`UserController`)

#### **GET** `/api/User/GetPhysicians`
Get all physician users

**Response:**
```json
{
  "isSuccess": true,
  "result": [
    {
      "id": 0,
      "userName": "string",
      "name": "string",
      "surname": "string",
      "emailAddress": "string",
      "phoneNumber": "string",
      "userType": "Physician",
      "isActive": true
    }
  ]
}
```

#### **POST** `/api/User/AddPhysician`
Create new physician account

**Request Body:**
```json
{
  "userName": "string",
  "name": "string",
  "surname": "string",
  "emailAddress": "string",
  "password": "string",
  "phoneNumber": "string"
}
```

#### **POST** `/api/User/EditPhysician`
Update physician information

**Request Body:** `UserDto`

#### **DELETE** `/api/User/DeletePhysician`
Delete physician account

**Query Parameters:**
- `userId` (long)

---

### 7. Common Controller (`CommonController`)

#### **GET** `/api/Common/GetCountries`
Get list of countries/nationalities

**Response:**
```json
{
  "isSuccess": true,
  "result": [
    {
      "id": 0,
      "name": "string",
      "code": "string"
    }
  ]
}
```

---

### 8. Payment Status Controller (`PaymentStatusController`)

Used for payment processing integration (details in implementation).

---

## Application Services

### 1. ClientAppService
**File:** `CoreVision.Application/Services/ClientAppService.cs`

**Responsibilities:**
- Client CRUD operations
- Client profile management
- Health concern tracking
- Paginated client reports with complex filtering
- Message management

**Key Methods:**
- `GetClient(int id)`: Retrieve client with messages
- `GetClients()`: List all clients
- `AddOrUpdateClient(ClientDto)`: Upsert client
- `EditClient(ClientDto)`: Update client info
- `EditClientHealthConcern(ClientDto)`: Update health concerns
- `GetClientReportPagedAsync(ClientReportQueryOption)`: Complex filtered reports
- `GetClientProfile(int clientId)`: Detailed profile with latest readings
- `AddClientMessages(ClientDto)`: Add client notifications

**Dependencies:**
- `IRepository<Client>`
- `IRepository<Country>`
- `IObjectMapper` (AutoMapper)

---

### 2. ArrhythmiaAppService
**File:** `CoreVision.Application/Services/ArrhythmiaAppService.cs`

**Responsibilities:**
- Integration with external arrhythmia detection API
- Arrhythmia result management
- Statistical reporting
- Questionnaire processing

**External API Integration:**
- **Base URL:** `https://arrhythmia-detection.ainexus.com/api/v1/`
- **Authentication:** Basic Auth (Username/Password)
- **Endpoints Used:**
  - Login
  - Arrhythmia detection submission
  - Results retrieval

**Key Methods:**
- `GetArrhythmiaRequest(int clientId)`: Latest detection request
- `GetArrhythmiaRequests(int clientId)`: All results for client
- `AddArrhythmiaRequest(ArrhythmiaRequestDto)`: Submit detection request
- `GetArrhythmiaSummaries(filters)`: Aggregated statistics
- `EditArrhythmiasQuestionnaire(EditArrhythmiaQuestionnaireDto)`: Update questionnaire

**Features:**
- Async processing with semaphore for rate limiting
- Comprehensive logging
- Error handling with fallback
- Background processing support

**Dependencies:**
- `IRepository<ArrhythmiaDetectionRequest>`
- `IGenericRepository<ArrhythmiaResult>`
- `IRepository<ArrhythmiaSummary>`
- `IRepository<Client>`
- `HttpClient` (for external API)

---

### 3. EmailAppService
**File:** `CoreVision.Application/Services/EmailAppService.cs`

**Responsibilities:**
- Email sending via SMTP (Office 365)
- HTML email generation
- Medical report formatting
- Fallback email service

**Email Settings:**
```json
{
  "From": "info@carevisionai.com",
  "SmtpServer": "smtp.office365.com",
  "Port": 587,
  "Username": "info@carevisionai.com",
  "Password": "tsmrqdvmmrdlxvvq"
}
```

**Key Methods:**
- `SendEmail(EmailRequestDto)`: Generic email sending
- `GenerateMedicalReportHtml(MedicalReportDto)`: Create formatted HTML report

**Features:**
- HTML and plain text support
- Comprehensive logging with unique email IDs
- Connection timeout handling (30 seconds)
- StartTLS security
- Environment variable configuration support

**Medical Report Template:**
- Bilingual (English/Arabic) design
- Professional healthcare styling
- Patient vitals summary
- Symptoms tracking
- Responsive layout

**Dependencies:**
- `MailKit.Net.Smtp`
- `MimeKit`

---

### 4. ResendEmailService
**File:** `CoreVision.Application/Services/ResendEmailService.cs`

**Responsibilities:**
- Primary email service using Resend API
- Modern, reliable email delivery
- Automatic fallback to SMTP

**Configuration:**
```json
{
  "ApiKey": "",
  "FromEmail": "onboarding@resend.dev",
  "FromName": "CareVision Health"
}
```

**Environment Variables:**
- `RESEND_APITOKEN`: API key (priority over config)
- `ResendEmailSettings__FromEmail`: Override sender
- `ResendEmailSettings__FromName`: Override sender name

**Key Methods:**
- `SendEmail(EmailRequestDto)`: Send via Resend API
- `GenerateMedicalReportHtml(MedicalReportDto)`: Reuse from EmailAppService

**Service Selection Logic:**
```
1. Check RESEND_APITOKEN environment variable
2. If present → Use ResendEmailService
3. If absent or fails → Fallback to EmailAppService (SMTP)
```

**Benefits:**
- Better deliverability rates
- No SMTP configuration needed
- Real-time analytics
- Reliable (no timeouts)
- Scalable
- No password storage

**Dependencies:**
- `Resend` NuGet package (v0.1.5)

---

### 5. ScanResultAppService
**File:** `CoreVision.Application/Services/ScanResultAppService.cs`

**Responsibilities:**
- Scan result CRUD operations
- Latest scan retrieval
- Historical scan data

**Key Methods:**
- `GetClientLatestScanResult(int clientId)`: Most recent scan
- `GetScanResultsByClientId(int clientId)`: All scans for client
- `AddScanResult(ScanResultDto)`: Record new scan

---

### 6. CommonAppService
**File:** `CoreVision.Application/Services/CommonAppService.cs`

**Responsibilities:**
- Reference data management
- Country/Nationality lookup

**Key Methods:**
- `GetCountries()`: List all countries

---

### 7. PaymentStatusService
**File:** `CoreVision.Application/Services/PaymentStatusService.cs`

**Responsibilities:**
- Payment processing status tracking
- Integration with payment gateways

---

## Configuration

### appsettings.json Structure

```json
{
  "ConnectionStrings": {
    "Default": "Azure SQL Database Connection String"
  },
  "App": {
    "ServerRootAddress": "https://localhost:44311/",
    "ClientRootAddress": "http://localhost:4200/",
    "CorsOrigins": "*"
  },
  "ArrhythmiaConfiguration": {
    "BaseUrl": "https://arrhythmia-detection.ainexus.com/api/v1/",
    "UserName": "abdallah@carevisionai",
    "Password": "zyhzyJ-vahqa9-jufjej"
  },
  "EmailSettings": {
    "From": "info@carevisionai.com",
    "SmtpServer": "smtp.office365.com",
    "Port": 587,
    "Username": "info@carevisionai.com",
    "Password": "tsmrqdvmmrdlxvvq"
  },
  "ResendEmailSettings": {
    "ApiKey": "",
    "FromEmail": "onboarding@resend.dev",
    "FromName": "CareVision Health"
  },
  "Authentication": {
    "JwtBearer": {
      "IsEnabled": "true",
      "SecurityKey": "CoreVision_B9DB6D6750C44085A0F20F3DD66F3FF3",
      "Issuer": "CoreVision",
      "Audience": "CoreVision"
    }
  },
  "Swagger": {
    "ShowSummaries": true
  },
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "Microsoft.AspNetCore": "Warning",
        "Microsoft.EntityFrameworkCore": "Error",
        "System": "Error",
        "HealthCheck": "Debug"
      }
    },
    "WriteTo": [
      {
        "Name": "File",
        "Args": {
          "path": "Logs/log-.txt",
          "rollingInterval": "Day",
          "retainedFileCountLimit": 7,
          "restrictedToMinimumLevel": "Information"
        }
      },
      {
        "Name": "MSSqlServer",
        "Args": {
          "connectionString": "...",
          "tableName": "SystemLogs",
          "autoCreateSqlTable": false
        }
      }
    ]
  }
}
```

### Environment-Specific Configuration

**Development:** `appsettings.Development.json`
**Staging:** `appsettings.Staging.json`
**Production:** Environment variables (Railway/Azure)

### Environment Variables Priority

1. System environment variables
2. User secrets (Development)
3. appsettings.{Environment}.json
4. appsettings.json

---

## Logging Strategy

### Serilog Configuration

**File Logging:**
- Location: `/Logs/log-{Date}.txt`
- Rolling: Daily
- Retention: 7 days
- Format: Timestamp, Level, Message, Exception, Request/Response Body

**Database Logging:**
- Table: `SystemLogs`
- Columns: Timestamp, Level, Message, Exception, RequestBody, ResponseBody, LogEvent
- Level: Information and above

**Log Levels:**
- **Debug**: HealthCheck namespace
- **Information**: Default, File, Database
- **Warning**: Microsoft frameworks
- **Error**: Entity Framework, System

**Request/Response Logging:**
- Middleware captures all API calls
- Sensitive data filtering
- Performance tracking
- Error diagnostics

---

## Security

### Authentication & Authorization

**JWT Configuration:**
- Algorithm: HS256
- Expiration: Configurable (default: token lifetime in settings)
- Claims: Subject, JTI, IAT, User-specific claims
- Token Encryption: SimpleStringCipher for EncryptedAccessToken

**Password Policy:**
- Managed by ABP Framework
- Configurable complexity requirements
- Hashing: ASP.NET Core Identity

**CORS Policy:**
- Development: Allow all (`*`)
- Production: Restrict to specific origins

### Data Protection

**Database Security:**
- Azure SQL Database with SSL/TLS
- Encrypted connection strings
- Firewall rules
- No passwords in source control (use environment variables)

**API Security:**
- HTTPS required in production
- Anti-forgery tokens for state-changing operations
- Request validation
- SQL injection prevention (EF Core parameterized queries)

**Secrets Management:**
- User Secrets (Development)
- Environment Variables (Production)
- Azure Key Vault (Recommended for production)

---

## Deployment

### Railway Deployment

**Environment Variables Required:**
```bash
# Database
ConnectionStrings__Default=...

# Email (Primary - Resend)
RESEND_APITOKEN=re_xxxxx
ResendEmailSettings__FromEmail=noreply@yourdomain.com
ResendEmailSettings__FromName=CareVision Health

# Email (Fallback - SMTP)
EmailSettings__From=info@carevisionai.com
EmailSettings__SmtpServer=smtp.office365.com
EmailSettings__Port=587
EmailSettings__Username=info@carevisionai.com
EmailSettings__Password=xxxxx

# External APIs
ArrhythmiaConfiguration__BaseUrl=https://arrhythmia-detection.ainexus.com/api/v1/
ArrhythmiaConfiguration__UserName=xxxxx
ArrhythmiaConfiguration__Password=xxxxx

# JWT
Authentication__JwtBearer__SecurityKey=xxxxx
Authentication__JwtBearer__Issuer=CoreVision
Authentication__JwtBearer__Audience=CoreVision

# CORS
App__CorsOrigins=https://yourdomain.com

# Environment
ASPNETCORE_ENVIRONMENT=Production
```

**Build Configuration:**
```bash
dotnet publish -c Release -o ./out
```

**Docker Support:**
- Dockerfile available in solution
- Docker Compose for local development
- Linux container target

---

## Database Migrations

### Migration History (Recent)

1. **20250503083000_initcareVision** - Initial CareVision schema
2. **20250510140328_Add_Arrhythmia** - Arrhythmia detection tables
3. **20250511180215_Edit_ScanResult_RemoveRelation** - Refactor relationships
4. **20250516004649_Edit_Arrhythmia** - Arrhythmia enhancements
5. **20250519201850_Edit_Client** - Client entity updates
6. **20250519212923_Edit_Client_AddSPO2** - Add SPO2 field
7. **20250519225043_Add_ClientPossibleCause** - Possible causes tracking
8. **20250522110726_Edit_Client_AddUserType** - User type classification
9. **20250528012055_Edit_ArrhythmiaResult_AddQuestionnaire** - Questionnaire integration
10. **20250529144534_Edit_SystemLogs_Add_ResponseBody** - Enhanced logging
11. **20250601225000_Add_ArrhythmiaQuestionnaireAnswers** - Questionnaire answers

### Running Migrations

**Using Migrator Tool:**
```bash
cd src/CoreVision.Migrator
dotnet run
```

**Using EF Core CLI:**
```bash
dotnet ef database update --project src/CoreVision.EntityFrameworkCore
```

**Creating New Migration:**
```bash
dotnet ef migrations add MigrationName --project src/CoreVision.EntityFrameworkCore
```

---

## Testing

### Test Projects

**1. CoreVision.Tests**
- Unit tests for domain logic
- Service layer tests
- Repository tests

**2. CoreVision.Web.Tests**
- Integration tests
- API endpoint tests
- Authentication tests

### Running Tests

```bash
# Run all tests
dotnet test

# Run specific test project
dotnet test test/CoreVision.Tests/CoreVision.Tests.csproj

# With coverage
dotnet test /p:CollectCoverage=true
```

---

## Development Setup

### Prerequisites

- .NET 9.0 SDK
- SQL Server / Azure SQL Database
- Visual Studio 2022 or VS Code
- Postman or similar API testing tool

### Local Setup Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd Kiosk-BE2/9.4.2/aspnet-core
   ```

2. **Configure Database**
   - Update connection string in `appsettings.json`
   - Run migrations:
     ```bash
     cd src/CoreVision.Migrator
     dotnet run
     ```

3. **Configure User Secrets** (Development)
   ```bash
   cd src/CoreVision.Web.Host
   dotnet user-secrets set "ConnectionStrings:Default" "your-connection-string"
   dotnet user-secrets set "RESEND_APITOKEN" "your-resend-api-key"
   ```

4. **Restore Packages**
   ```bash
   dotnet restore
   ```

5. **Build Solution**
   ```bash
   dotnet build
   ```

6. **Run Application**
   ```bash
   cd src/CoreVision.Web.Host
   dotnet run
   ```

7. **Access Swagger UI**
   ```
   https://localhost:44311/swagger
   ```

### Default Admin Credentials

**Username:** `admin`
**Password:** `123qwe` (Change in production!)

---

## API Usage Examples

### Example 1: Complete Patient Flow

**Step 1: Authenticate**
```bash
curl -X POST "https://your-api.com/api/TokenAuth/Authenticate" \
  -H "Content-Type: application/json" \
  -d '{
    "userNameOrEmailAddress": "admin",
    "password": "123qwe"
  }'
```

**Step 2: Create/Update Patient**
```bash
curl -X POST "https://your-api.com/api/Client/AddOrUpdateClient" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "age": 45,
    "gender": 1,
    "nationalityId": 1
  }'
```

**Step 3: Add Scan Results**
```bash
curl -X POST "https://your-api.com/api/ScanResult/AddScanResult" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": 1,
    "timestamp": "2025-01-01T10:00:00Z",
    "realTimeHeartRate": 75,
    "systolicBloodPressureMmhg": 120,
    "diastolicBloodPressureMmhg": 80,
    "breathingRate": 16
  }'
```

**Step 4: Request Arrhythmia Detection**
```bash
curl -X POST "https://your-api.com/api/Arrhythmia/AddArrhythmiaRequest" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": 1,
    "scanId": 1,
    "hrIntervals": "800,820,815,810,..."
  }'
```

**Step 5: Send Medical Report**
```bash
curl -X POST "https://your-api.com/api/Email/SendMedicalReport" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "receiver": "john@example.com",
    "reportData": {
      "date": "01/01/2025",
      "time": "10:00:00",
      "name": "John Doe",
      "age": 45,
      "gender": "Male",
      "heartRate": 75,
      "bloodPressure": "120/80",
      "heartRateVariability": 45,
      "respirationRate": 16,
      "reportedSymptoms": "None"
    }
  }'
```

---

## Troubleshooting

### Common Issues

**1. Database Connection Failure**
- Verify connection string
- Check Azure SQL firewall rules
- Ensure database exists and migrations are applied

**2. Email Sending Fails**
- Check `RESEND_APITOKEN` if using Resend
- Verify SMTP credentials if using Office 365
- Check network connectivity
- Review email service logs

**3. JWT Authentication Errors**
- Verify SecurityKey matches between token generation and validation
- Check token expiration
- Ensure Authorization header format: `Bearer {token}`

**4. Arrhythmia API Integration Issues**
- Verify external API credentials
- Check network connectivity to `arrhythmia-detection.ainexus.com`
- Review ArrhythmiaAppService logs
- Check semaphore limits for concurrent requests

**5. CORS Errors**
- Update `App:CorsOrigins` in configuration
- Ensure client URL is in allowed origins
- Check browser console for specific CORS error

---

## Performance Considerations

### Database Optimization

- **Indexes**: Defined on foreign keys and frequently queried columns
- **Include Relationships**: Use `.Include()` for eager loading to avoid N+1 queries
- **Pagination**: All list endpoints support pagination
- **Async Operations**: All database operations are async

### Caching Strategy

- **In-Memory Cache**: For reference data (countries, lookup tables)
- **Distributed Cache**: Consider Redis for production scale
- **Response Caching**: Configured for static endpoints

### API Performance

- **Async/Await**: All I/O operations are asynchronous
- **Rate Limiting**: Semaphore used for external API calls (3-4 concurrent)
- **Logging**: Selective logging to reduce overhead
- **Compression**: Response compression enabled

---

## Monitoring & Observability

### Application Logs

**File Logs Location:** `/Logs/log-{Date}.txt`

**Database Logs:** `SystemLogs` table

**Log Structure:**
```
[Timestamp] [Level] [Message]
Request Body: {...}
Response Body: {...}
Exception: {...}
```

### Health Checks

Implement health check endpoints for:
- Database connectivity
- External API availability
- Email service status

### Metrics to Monitor

- API response times
- Database query performance
- Email delivery rates
- Arrhythmia detection success rates
- Error rates by endpoint
- Authentication failures

---

## Future Enhancements

### Planned Features

1. **Real-time Notifications**
   - SignalR integration (already included)
   - Push notifications for critical health alerts

2. **Advanced Analytics**
   - Machine learning for health trends
   - Predictive risk assessment
   - Population health dashboards

3. **Multi-language Support**
   - Localization infrastructure (ABP Framework)
   - Arabic, Spanish, French support

4. **Mobile API Optimization**
   - GraphQL support
   - Optimized DTOs for mobile
   - Offline sync capabilities

5. **FHIR Integration**
   - HL7 FHIR compliance
   - EHR system integration
   - Standardized health data exchange

6. **Advanced Security**
   - OAuth 2.0 / OpenID Connect
   - Two-factor authentication
   - Audit logging enhancements

---

## Support & Documentation

### Additional Resources

- **ABP Framework Documentation**: https://docs.abp.io
- **ASP.NET Core Documentation**: https://docs.microsoft.com/aspnet/core
- **Entity Framework Core**: https://docs.microsoft.com/ef/core
- **Resend API Documentation**: https://resend.com/docs
- **Swagger UI**: `{base-url}/swagger`

### Contact

For technical support or questions about this project, contact your development team.

---

## License

Proprietary - CareVision Health Assessment System

---

## Version History

- **v9.4.2**: Latest stable release (Current)
- **v9.4.1**: ABP Framework upgrade
- **v9.2.0**: Major feature additions
- **v9.1.0**: Entity framework updates
- **Initial Release**: May 2025

---

**Last Updated**: October 2025
**Document Version**: 1.0
**Project**: CareVision Health Kiosk Backend
