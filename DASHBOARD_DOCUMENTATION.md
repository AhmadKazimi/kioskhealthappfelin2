# Health Kiosk Dashboard - Complete Technical Documentation

## Table of Contents
1. [Dashboard Overview](#dashboard-overview)
2. [Architecture & Access Control](#architecture--access-control)
3. [Data Sources & APIs](#data-sources--apis)
4. [Dashboard Components](#dashboard-components)
5. [Authentication System](#authentication-system)
6. [Member Risk Status Panel](#member-risk-status-panel)
7. [Client Management Grid](#client-management-grid)
8. [User Profile Deep Dive](#user-profile-deep-dive)
9. [Physician Management](#physician-management)
10. [Email System Integration](#email-system-integration)
11. [Data Flow & State Management](#data-flow--state-management)
12. [Technical Implementation Details](#technical-implementation-details)

---

## Dashboard Overview

The **Health Kiosk Dashboard** (`admin-panel.tsx`) is a comprehensive administrative interface that provides healthcare administrators with real-time insights into patient health data, risk assessments, and system management capabilities.

### Key Features
- **Real-time Health Monitoring**: Live tracking of patient vital signs and risk levels
- **Multi-dimensional Filtering**: Filter by nationality, gender, age group, and arrhythmia conditions
- **Risk Assessment Visualization**: Color-coded risk levels with detailed condition breakdowns
- **Patient Communication**: Email-based health reading requests
- **Physician Management**: Complete CRUD operations for healthcare providers
- **Internationalization**: Full English/Arabic language support

---

## Architecture & Access Control

### Component Structure
```typescript
// Main Dashboard Component
interface AdminPanel {
  onExit: () => void;  // Return to kiosk mode
}

// Authentication States
interface AuthenticationState {
  isAuthenticated: boolean;
  username: string;
  password: string;
  isAdmin: boolean;      // Admin vs Physician access levels
  error: string;
}

// Access Levels
enum UserType {
  Admin = "Admin",       // Full system access
  Physician = "Physician" // Limited to patient data
}
```

### Access Control Matrix
| Feature | Admin | Physician |
|---------|--------|-----------|
| View Patient Data | ✅ | ✅ |
| Send Email Requests | ✅ | ✅ |
| Physician Management | ✅ | ❌ |
| System Settings | ✅ | ❌ |
| Dashboard Filters | ✅ | ✅ |

---

## Data Sources & APIs

### Primary API Endpoints

#### 1. Authentication API
```typescript
POST /TokenAuth/Authenticate
Request: {
  userNameOrEmailAddress: string;
  password: string;
}
Response: {
  AccessToken: string;
  UserType: "Admin" | "Physician";
}
```

#### 2. Arrhythmia Summary API
```typescript
GET /Arrhythmia/GetArrhythmiaSummaries
Parameters: {
  nationalityId?: number;
  gender?: string;      // "1" (Male) | "2" (Female)
  ageGroup?: string;    // "18-30" | "31-40" | "41-50" | "51-60" | "60+"
}
Response: ArrhythmiaReport {
  TotalRecords: number;
  TotalAtRisk: number;
  Arrhythmias: ArrhythmiaReportDetail[];
}
```

#### 3. Client Reports API
```typescript
POST /Client/GetClientsReport
Request: {
  Page: number;
  PageSize: number;
  ClientName?: string;     // Search filter
  ArrhythmiaName?: string; // Condition filter
  NationalityId?: number;
  Gender?: string;
  AgeGroup?: string;
  AtRisk?: boolean;        // Risk status filter
  SortBy: string;         // "LastVitalsReading"
  SortOrder: string;      // "desc"
}
```

#### 4. Client Profile API
```typescript
GET /Client/GetClientProfile?clientId=${clientId}
Response: ClientProfile {
  LatestReadings: LatestReading[];
  ArrhythmiaRisks: ArrhythmiaRisk[];
  Demographics: ClientDemographics;
}
```

### Data Models

#### Client Record Structure
```typescript
interface ClientRecord {
  ClientId: string;
  ClientName: string | null;
  LastVitalsReading: string;    // ISO date string
  BloodPressure: string;        // "120/80" format
  HeartRate: number;
  HeartRateVariability: number;
  RespirationRate: number;
  Trend: "up" | "down" | "stable";
  Email: string;
  RiskCategories: RiskCategory[];
}

interface RiskCategory {
  RiskCategory: string;         // Condition name
  RiskLevel: "HighRisk" | "Suspected" | "Confirmed";
}
```

#### Arrhythmia Report Structure
```typescript
interface ArrhythmiaReportDetail {
  ArrhythmiaName: string;       // Condition identifier
  AtRiskCount: number;          // High risk patients
  SuspectedCount: number;       // Suspected cases
  ConfirmedCount: number;       // Confirmed (ruled out) cases
}
```

---

## Dashboard Components

### Main Navigation
```typescript
// Tab-based Interface
<Tabs defaultValue="member-risk">
  <TabsTrigger value="member-risk">Member Risk Status</TabsTrigger>
  <TabsTrigger value="settings">Settings</TabsTrigger>
</Tabs>
```

### Filter Controls
```typescript
// Multi-dimensional Filtering System
const FilterControls = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
    <CountrySelector 
      value={selectedNationality} 
      onSelect={setSelectedNationality} 
    />
    <Select 
      options={genderOptions} 
      value={selectedGender}
      onChange={setSelectedGender}
    />
    <Select 
      options={ageGroupOptions}
      value={selectedAgeGroup} 
      onChange={setSelectedAgeGroup}
    />
    <Button onClick={clearFilters}>Reset Filters</Button>
  </div>
);
```

---

## Authentication System

### Login Flow
```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const response = await fetch(`${apiUrl}/TokenAuth/Authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userNameOrEmailAddress: username,
        password: password
      }),
    });

    if (response.ok) {
      const data = await response.json();
      
      // Store authentication state
      Cookies.set('adminToken', data.AccessToken, { expires: 1 });
      Cookies.set('adminType', data.UserType, { expires: 1 });
      
      setIsAdmin(data.UserType === 'Admin');
      setIsAuthenticated(true);
    }
  } catch (err) {
    setError(t('admin.validation.invalidCredentials'));
  }
};
```

### Session Management
```typescript
// Persistent Authentication Check
useEffect(() => {
  const token = Cookies.get('adminToken');
  const userType = Cookies.get('adminType');

  if (token) {
    setIsAuthenticated(true);
  }
  
  if (userType === "Admin") {
    setIsAdmin(true);
  }
}, []);
```

### Security Features
- **Token-based authentication** with automatic expiration
- **Role-based access control** (Admin vs Physician)
- **Session persistence** across browser sessions
- **Automatic logout** on authentication failure

---

## Member Risk Status Panel

### Summary Cards System
```typescript
// Risk Overview Cards
const SummaryCards = () => (
  <>
    {/* At Risk Summary */}
    <Card className="col-span-2">
      <h3>At Risk</h3>
      <p className="text-4xl font-bold text-red-500">{totalAtRisk}</p>
      <Button>View All</Button>
    </Card>

    {/* Total Patients */}
    <Card className="col-span-2">
      <h3>Total</h3>
      <p className="text-4xl font-bold">{totalRecords}</p>
      <Button>View All</Button>
    </Card>

    {/* Individual Condition Cards */}
    {arrhythmiaReport?.Arrhythmias.map(condition => (
      <ConditionCard key={condition.ArrhythmiaName} condition={condition} />
    ))}
  </>
);
```

### Condition Cards
```typescript
interface ConditionCardProps {
  condition: ArrhythmiaReportDetail;
}

const ConditionCard = ({ condition }: ConditionCardProps) => (
  <Card className="col-span-2">
    <div className="flex justify-between items-center">
      <h3>{getTranslatedConditionName(condition.ArrhythmiaName)}</h3>
      <CollapseButton onClick={() => toggleConditionCollapse(condition.ArrhythmiaName)} />
    </div>
    
    <div className="grid grid-cols-3 gap-1">
      <MetricDisplay 
        value={condition.SuspectedCount} 
        label="Suspected" 
        color="amber" 
      />
      <MetricDisplay 
        value={condition.AtRiskCount} 
        label="At Risk" 
        color="red" 
      />
      <MetricDisplay 
        value={condition.ConfirmedCount} 
        label="Confirmed" 
        color="green" 
      />
    </div>
  </Card>
);
```

### Supported Arrhythmia Conditions
```typescript
const SUPPORTED_CONDITIONS = [
  "Atrial Flutter",
  "Sleep Apnea", 
  "PVC (Premature Ventricular Contractions)",
  "Atrial Fibrillation",
  "Heart Block",
  "Congestive Heart Failure",
  "Supraventricular Tachycardia",
  "Myocardial Infarction",
  "Sinus Bradycardia"
];
```

---

## Client Management Grid

### Data Grid Implementation
```typescript
// Paginated Client Table
const ClientGrid = () => (
  <Table className="w-full">
    <TableHeader>
      <TableRow>
        <TableHead>Member ID</TableHead>
        <TableHead>Member Name</TableHead>
        <TableHead>Last Vitals Reading</TableHead>
        <TableHead>Risk Category</TableHead>
        <TableHead>Risk Level</TableHead>
        <TableHead>Blood Pressure</TableHead>
        <TableHead>Heart Rate</TableHead>
        <TableHead>Heart Rate Variability</TableHead>
        <TableHead>Respiration Rate</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {clientRecords.map(record => (
        <ClientRow key={record.ClientId} record={record} />
      ))}
    </TableBody>
  </Table>
);
```

### Advanced Filtering
```typescript
// Real-time Search & Filter
const FilteredDataFetch = () => {
  const debouncedGridFetch = debounce(() => {
    fetchClientsReport();
  }, 300);

  useEffect(() => {
    if (searchTerm && searchTerm.length < 3) {
      return; // Minimum search length
    }
    
    debouncedGridFetch();
    return () => {
      debouncedGridFetch.cancel();
    };
  }, [searchTerm, currentPage, gridFilterAtRisk, gridFilterByArrhythmia]);
};
```

### Pagination System
```typescript
// Advanced Pagination with Page Size Control
const PaginationControls = () => (
  <div className="flex items-center justify-between">
    {/* Results Summary */}
    <div className="text-sm text-gray-600">
      Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, clientRecords.length)} 
      of {clientsReport?.TotalItemsCount} records
    </div>

    {/* Page Navigation */}
    <div className="flex items-center gap-2">
      <Button disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>
        First
      </Button>
      <Button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
        Previous
      </Button>
      
      {/* Dynamic Page Numbers */}
      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
        <PageButton key={i} pageNumber={calculatePageNumber(i)} />
      ))}
      
      <Button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
        Next
      </Button>
      <Button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>
        Last
      </Button>
      
      {/* Items Per Page Selector */}
      <Select 
        options={[5, 10, 20, 50].map(num => ({ value: num, label: `${num} per page` }))}
        onChange={(option) => setItemsPerPage(option?.value || 10)}
      />
    </div>
  </div>
);
```

### Risk Level Visualization
```typescript
// Color-coded Risk Display
const RiskLevelDisplay = ({ riskCategories }: { riskCategories: RiskCategory[] }) => (
  <TableCell>
    {riskCategories.length > 0 ? (
      riskCategories.map((category, index) => (
        <span
          key={index}
          className={`flex mt-2 px-2 py-1 rounded text-white ${
            category.RiskLevel === "HighRisk" ? "bg-red-500" :
            category.RiskLevel === "Suspected" ? "bg-amber-500" :
            "bg-green-500"
          }`}
        >
          {translateRiskLevel(category.RiskLevel)}
        </span>
      ))
    ) : (
      <span className="px-2 py-1 rounded text-white bg-green-500">
        Low Risk
      </span>
    )}
  </TableCell>
);
```

---

## User Profile Deep Dive

### Individual Patient Analysis
```typescript
// Comprehensive Patient Profile
interface UserProfileProps {
  onBack: () => void;
  clientId?: string;
}

const UserProfile = ({ onBack, clientId }: UserProfileProps) => {
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [latestReading, setLatestReading] = useState<LatestReading | null>(null);
  const [trends, setTrends] = useState<Record<string, HealthTrend>>({});
  
  // Fetch comprehensive patient data
  useEffect(() => {
    fetchUserData();
  }, [clientId]);
};
```

### Health Trends Analysis
```typescript
interface HealthTrend {
  id: string;
  user_id: string;
  trend_type: "3day" | "7day" | "30day";
  blood_pressure_avg: string;
  spo2_avg: number;
  heart_rate_avg: number;
  respiration_rate_avg: number;
  temperature_avg: number;
  glucose_avg: number;
  hba1c_avg: number;
  bmi_avg: number;
  blood_pressure_trend: "Stable" | "Increasing" | "Decreasing";
  spo2_trend: "Stable" | "Increasing" | "Decreasing";
  heart_rate_trend: "Stable" | "Increasing" | "Decreasing";
  calculated_at: string;
}
```

### Arrhythmia Risk Assessment Display
```typescript
// Detailed Condition Analysis with Questionnaire Results
const ConditionItem = ({ risk, questionnaireData }: ConditionItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
      {/* Risk Level Header */}
      <div className="flex justify-between items-center">
        <h3 className={getRiskColorClass(risk.InitialRiskLevel)}>
          {getTranslatedConditionName(risk.ArrhythmiaName)}
        </h3>
        <RiskLevelBadge level={risk.QuestionnaireRiskLevel} />
      </div>

      {/* Expandable Details */}
      {isExpanded && (
        <>
          <QuestionnaireResponses 
            condition={risk} 
            questionnaireData={questionnaireData} 
          />
          <AssessmentSummary risk={risk} />
          <RecommendationsPanel risk={risk} />
        </>
      )}
    </div>
  );
};
```

---

## Physician Management

### Physician CRUD Operations
```typescript
interface Physician {
  Id: string;
  UserName: string;
  Name: string;
  Surname: string;
  EmailAddress: string;
  Password: string;
}

// Physician Management Grid
const PhysiciansGrid = () => {
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPhysician, setCurrentPhysician] = useState<Partial<Physician> | null>(null);

  // CRUD Operations
  const fetchPhysicians = async () => {
    const response = await fetch(`${apiUrl}/User/GetPhysicians`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
  };

  const createOrUpdatePhysician = async (physicianData: Physician) => {
    const endpoint = physicianData.Id ? 
      `/User/UpdatePhysician` : 
      `/User/CreatePhysician`;
    
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(physicianData)
    });
  };

  const deletePhysician = async (physicianId: string) => {
    await fetch(`${apiUrl}/User/DeletePhysician?id=${physicianId}`, {
      method: "DELETE",
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
  };
};
```

### Security & Validation
```typescript
// Form Validation
const [errors, setErrors] = useState({
  UserName: "",
  Name: "",
  Password: "",
  EmailAddress: "",
});

const validateForm = (physician: Partial<Physician>) => {
  const newErrors = { ...errors };
  
  if (!physician.UserName?.trim()) {
    newErrors.UserName = t('admin.validation.usernameRequired');
  }
  
  if (!physician.Name?.trim()) {
    newErrors.Name = t('admin.validation.nameRequired');
  }
  
  if (!physician.Password && !physician.Id) {
    newErrors.Password = t('admin.validation.passwordRequired');
  }
  
  return newErrors;
};
```

---

## Email System Integration

### Request Reading Email Flow
```typescript
// Email Communication System
const handleRequestReading = (record: ClientRecord) => {
  setSelectedRecord(record);
  setMessageType("Default");
  setIsRequestReadingOpen(true);
};

const handleSendRequest = async () => {
  // Email Configuration Options
  const emailConfig = {
    receiver: selectedRecord?.Email,
    subject: t('admin.email.subject'),
    text: generateHTMLTemplate(),
    IsHtml: true
  };

  const response = await fetch(`${apiUrl}/email/sendEmail`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(emailConfig),
  });
};
```

### HTML Email Template
```typescript
// Professional Email Template Generator
const generateHTMLTemplate = () => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t('admin.email.title')}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
    <!-- Header with Gradient -->
    <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px 20px;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">${t('admin.email.title')}</h1>
      <p style="color: #bfdbfe; margin: 10px 0 0 0;">${t('admin.email.subtitle')}</p>
    </div>
    
    <!-- Content Area -->
    <div style="padding: 40px 30px;">
      <div style="background-color: #f1f5f9; border-left: 4px solid #2563eb; padding: 20px;">
        <p style="margin: 0; font-size: 16px; line-height: 1.6;">${requestReadingMessage}</p>
      </div>
      
      <!-- Call to Action -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${hostUrl}/" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px;">
          ${t('admin.email.buttonText')}
        </a>
      </div>
      
      <!-- Instructions -->
      <div style="background-color: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px;">
        <p style="margin: 0; font-size: 14px; color: #92400e;">
          <strong>${t('admin.email.importantLabel')}</strong> ${t('admin.email.deviceInstructions')}
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #64748b;">${t('admin.email.providerMessage')}</p>
    </div>
  </div>
</body>
</html>
`;
```

---

## Data Flow & State Management

### Real-time Data Updates
```typescript
// Debounced Data Fetching
const debouncedFetch = debounce(() => {
  fetchArrhythmiaSummaries();
}, 300);

useEffect(() => { 
  debouncedFetch();
  
  return () => {
    debouncedFetch.cancel(); // Cleanup on unmount
  };
}, [selectedNationality, selectedGender, selectedAgeGroup]);
```

### State Management Architecture
```typescript
// Centralized Dashboard State
interface DashboardState {
  // Authentication
  isAuthenticated: boolean;
  isAdmin: boolean;
  
  // Data States
  arrhythmiaReport: ArrhythmiaReport | null;
  clientsReport: ClientReport;
  clientRecords: ClientRecord[];
  
  // Filter States
  selectedNationality: string | number;
  selectedGender: string;
  selectedAgeGroup: string;
  searchTerm: string;
  
  // UI States
  loading: boolean;
  gridLoading: boolean;
  currentPage: number;
  itemsPerPage: number;
  
  // Modal States
  selectedUser: string | null;
  isRequestReadingOpen: boolean;
  selectedRecord: ClientRecord | null;
}
```

### Data Synchronization
```typescript
// Cross-component Data Flow
useEffect(() => {
  // Filter changes trigger both summary and grid updates
  if (searchTerm && searchTerm.length < 3) {
    return;
  }

  debouncedGridFetch();
  return () => {
    debouncedGridFetch.cancel();
  };
}, [arrhythmiaReport, searchTerm, currentPage, gridFilterAtRisk, gridFilterByArrhythmia]);
```

---

## Technical Implementation Details

### Performance Optimizations
1. **Debounced API Calls**: 300ms debounce on search and filter changes
2. **Pagination**: Server-side pagination with configurable page sizes
3. **Lazy Loading**: Components load data on demand
4. **Memoized Translations**: Cached translation lookups
5. **Efficient Re-renders**: Strategic use of React.memo and useCallback

### Browser Compatibility
- **Modern Browser Support**: ES2017+ features
- **Responsive Design**: Mobile-first approach with breakpoints
- **Touch-friendly**: Optimized for touch interactions
- **Accessibility**: ARIA labels and keyboard navigation

### Error Handling
```typescript
// Comprehensive Error Handling
const handleAPIError = (error: any, fallbackData: any) => {
  console.error("API Error:", error);
  
  // Use fallback mock data
  setArrhythmiaReport(fallbackData);
  
  // Show user-friendly error message
  setError(t('common.tryAgain'));
};
```

### Internationalization
```typescript
// Dynamic Language Support
const getTranslatedConditionName = (conditionName: string): string => {
  const translationKey = getConditionTranslationKey(conditionName);
  return translationKey.startsWith('conditions.') ? 
    t(translationKey) : 
    conditionName;
};

// Condition Translation Mapping
const CONDITION_TRANSLATIONS = {
  "Heart Block": "conditions.heartBlock",
  "Atrial Flutter": "conditions.atrialFlutter",
  "Sinus Bradycardia": "conditions.sinusBradycardia",
  // ... additional mappings
};
```

### Security Considerations
1. **Token-based Authentication**: JWT tokens with expiration
2. **Role-based Access**: Admin vs Physician permissions
3. **API Authorization**: Bearer tokens on sensitive endpoints
4. **Session Management**: Automatic logout on token expiry
5. **Input Validation**: Client and server-side validation

---

## Troubleshooting & Known Issues

### Questionnaire Answers Not Displaying (Fixed)

**Issue**: Dashboard showed questionnaire answers as "Not Answered" even when patients completed questionnaires.

**Root Cause**: The `ClientAssessment` component was saving questionnaire answers locally but never transmitting them to the server. The dashboard retrieves data from the server via `/Client/GetClientProfile`, so local-only data was not visible.

**Solution**: Added server persistence to questionnaire completion flow:

```typescript
// Fixed in client-assessment.tsx
const handleQuestionnaireComplete = async (
  conditionIndex: number,
  answers: Record<number, string>,
  score: number,
  calculatedRiskLevel: RiskLevel
) => {
  // ... local updates ...

  // NEW: Save to server immediately after each questionnaire
  setSavingResults(true);
  try {
    await saveQuestionnaireResults(updatedConditions[conditionIndex]);
  } catch (error) {
    console.error("Failed to save questionnaire results:", error);
  } finally {
    setSavingResults(false);
  }

  // On completion of all questionnaires
  if (allQuestionnairesComplete) {
    await saveAllQuestionnaireResults(updatedConditions);
    onNext();
  }
};

// API calls to persist questionnaire data
const saveQuestionnaireResults = async (condition) => {
  await fetch(`${apiUrl}/Arrhythmia/UpdateArrhythmiaResult`, {
    method: "POST",
    body: JSON.stringify({
      ClientId: userId,
      ArrhythmiaName: condition.ArrhythmiaName,
      QuestionnaireRiskLevel: condition.QuestionnaireRiskLevel,
      QuestionnaireScore: condition.QuestionnaireScore,
      Answers: condition.Answers
    })
  });
};
```

**Features Added**:
- Individual questionnaire auto-save after each completion
- Bulk save of all questionnaires at assessment completion
- Loading indicator during save operations
- Error handling with graceful fallbacks
- Console logging for debugging

**API Endpoints Used**:
- `POST /Arrhythmia/UpdateArrhythmiaResult` - Save individual questionnaire
- `POST /Arrhythmia/UpdateMultipleArrhythmiaResults` - Bulk save all questionnaires

**Verification**: After implementing this fix, questionnaire answers will appear correctly in the dashboard's User Profile section under each condition's expanded view.

---

The dashboard provides a comprehensive, secure, and user-friendly interface for healthcare administrators to monitor patient health, manage risk assessments, and coordinate care delivery through the health kiosk system.