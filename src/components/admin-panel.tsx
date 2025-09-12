/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation";
import Select, { SingleValue } from "react-select";
import { ArrowDown, ArrowUp, Minus, Plus, ChevronLeft } from "lucide-react"
import Swal from "sweetalert2";
import { debounce } from 'lodash'; 
import Cookies from 'js-cookie'; 
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog" 
import CountrySelector from "./ui/country-selector" 
import { useTranslation } from "@/hooks/useTranslation"

import PhysiciansGrid from "@/components/physicians-grid";
import UserProfile from "./user-profile" 
 
interface ClientReport {
  Items: ClientRecord[] | []
  TotalItemsCount: number 
  TotalPages: number  
  HasPreviousPage: boolean
  HasNextPage: boolean 
}

interface ClientRecord {
  ClientId: string
  ClientName: string | null 
  LastVitalsReading: string   
  BloodPressure: string 
  HeartRate: number
  HeartRateVariability: number
  RespirationRate: number
  Trend: "up" | "down" | "stable"
  Email: string
  RiskCategories: RiskCategory[]
}

interface RiskCategory{
  RiskCategory: string
  RiskLevel: "HighRisk" | "Suspected" | "Confirmed"
}

interface ArrhythmiaReport {
  TotalRecords: number,
  TotalAtRisk: number,

  Arrhythmias: ArrhythmiaReportDetail[]
}

interface ArrhythmiaReportDetail {
  ArrhythmiaName: string,
  AtRiskCount: number,
  SuspectedCount: number,
  ConfirmedCount: number
}

interface DropDownOption {
  value: string;
  label: string;
} 

// Add condition name mapping function
function getConditionTranslationKey(conditionName: string): string {
  const conditionMap: Record<string, string> = {
    "Heart Block": "conditions.heartBlock",
    "Atrial Flutter": "conditions.atrialFlutter", 
    "Sinus Bradycardia": "conditions.sinusBradycardia",
    "Atrial Fibrillation": "conditions.atrialFibrillation",
    "Sleep Apnea": "conditions.sleepApnea",
    "Premature Ventricular Contractions": "conditions.prematureVentricularContractions",
    "PVC": "conditions.prematureVentricularContractions", // Alternative name for PVC
    "Supraventricular Tachycardia": "conditions.supraventricularTachycardia",
    "Myocardial Infarction": "conditions.myocardialInfarction", 
    "Congestive Heart Failure": "conditions.congestiveHeartFailure"
  };
  
  return conditionMap[conditionName] || conditionName;
}

export default function AdminPanel({ onExit }: { onExit: () => void }) {
  const [activeTab, setActiveTab] = useState("member-risk") 
  const [loading, setLoading] = useState(true) 
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const hostUrl = process.env.NEXT_PUBLIC_HOST_DOMAIN;
  const { t } = useTranslation();

  // Helper function to get translated condition name
  const getTranslatedConditionName = (conditionName: string): string => {
    const translationKey = getConditionTranslationKey(conditionName);
    // If it's a translation key, use the translation, otherwise return the original name
    return translationKey.startsWith('conditions.') ? t(translationKey) : conditionName;
  };

  // #region Auths 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  // #endregion 

  // #region Filters  

  // #region Main Filters
  const [arrhythmiaReport, setArrhythmiaReport] = useState<ArrhythmiaReport | null>(null)
  const [collapsedConditions, setCollapsedConditions] = useState<string[]>([])
  const [selectedNationality, setSelectedNationality] = useState<string | number>(0);
  const [selectedGender, setSelectedGender] = useState("All")
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("All")

  const genderOptions: DropDownOption[] = [{ value: "All", label: t('admin.filters.reset') }, { value: "1", label: t('userInfo.male') }, { value: "2", label: t('userInfo.female') }];
  const ageGroupOptions: DropDownOption[] = [{ value: "All", label: t('admin.filters.reset') }, { value: "18-30", label: "18-30" }, { value: "31-40", label: "31-40" }, { value: "41-50", label: "41-50" }, { value: "51-60", label: "51-60" }, { value: "60+", label: "60+" }];

  const genderSelectedOption = genderOptions.find(option => option.value === selectedGender);
  const ageGroupSelectedOption = ageGroupOptions.find(option => option.value === selectedAgeGroup);
  const totalAtRisk = arrhythmiaReport?.TotalAtRisk ?? 0;
  const totalRecords = arrhythmiaReport?.TotalRecords ?? 0;
  // #endregion 

  // #region Grid Filters  
  const [clientsReport, setClientsReport] = useState<ClientReport>()
  const [clientRecords, setClientRecords] = useState<ClientRecord[]>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null) 
  const [selectedRecord, setSelectedRecord] = useState<ClientRecord | null>(null)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [gridLoading, setGridLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("")  
  const [gridFilterAtRisk, setGridFilterAtRisk] = useState(false); 
  const [gridFilterByArrhythmia, setGridFilterByArrhythmia] = useState("");
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // const currentItems = clientRecords.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = clientsReport?.TotalPages ?? 1;  
  // #endregion 

 // #region Request Reading 
 const [isRequestReadingOpen, setIsRequestReadingOpen] = useState(false);
 const [sendMethod, setSendMethod] = useState<"Phone" | "Email">("Email");
 const [scheduleType, setScheduleType] = useState<"Now" | "Schedule For Later">("Now");
 const [messageType, setMessageType] = useState<"Default" | "Custom">("Default");
 const [requestReadingMessage, setRequestReadingMessage] = useState(""); 
 const [isSendingEmail, setIsSendingEmail] = useState(false);
 const [requestReadingValidationError, setRequestReadingValidationError] = useState("");

 // Create default message that updates when translations change
 const defaultMessage = `${t('requestReading.defaultMessageText')} ${t('requestReading.clickLink')} ${hostUrl}/`;
 
 // Update request reading message when translations change
 useEffect(() => {
   if (messageType === "Default") {
     setRequestReadingMessage(defaultMessage);
   }
 }, [defaultMessage, messageType]);

 // #endregion 

 // #endregion Filters 

  // #region Filter Functions 
  async function fetchArrhythmiaSummaries() {
    try {
      setLoading(true);

      const response = await fetch(`${apiUrl}/Arrhythmia/GetArrhythmiaSummaries?nationalityId=${selectedNationality}&gender=${selectedGender != "All" ? selectedGender : ""}&ageGroup=${selectedAgeGroup}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      const responseJson = await response.json();
      const arrhythmiaReport: ArrhythmiaReport = responseJson.Result;

      setArrhythmiaReport(arrhythmiaReport)
    }
    catch (error) {
      setArrhythmiaReport(mockConditionSummaries);
    }
    finally {
      setLoading(false)
    }
  }

  const debouncedFetch = debounce(() => {
    fetchArrhythmiaSummaries();
  }, 300);

  useEffect(() => { 
    debouncedFetch();  

    // Cleanup: cancel any pending debounced calls when component unmounts
    return () => {
      debouncedFetch.cancel();
    };
  }, [selectedNationality, selectedGender, selectedAgeGroup]);

  const toggleConditionCollapse = (conditionName: string) => {
    setCollapsedConditions(prev =>
      prev.includes(conditionName)
        ? prev.filter(name => name !== conditionName)
        : [...prev, conditionName]
    )
  }

  function clearFilters(){
    setSelectedNationality("0");
    setSelectedGender("All");
    setSelectedAgeGroup("All");
    setGridFilterAtRisk(false);
    setGridFilterByArrhythmia("");
  }
 // #endregion 

 // #region Grid Functions 
  const debouncedGridFetch = debounce(() => {
    fetchClientsReport();
  }, 300);

  useEffect(() => {  
    if(searchTerm && searchTerm.length < 3){
      return;
    }

    debouncedGridFetch();
    return () => {
      debouncedGridFetch.cancel();
    };
  }, [arrhythmiaReport, searchTerm, currentPage, gridFilterAtRisk, gridFilterByArrhythmia]);

  async function fetchClientsReport() {
    try {
      setGridLoading(true);

      const response = await fetch(`${apiUrl}/Client/GetClientsReport`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
              body: JSON.stringify({
        Page: currentPage, 
        PageSize: itemsPerPage,
        ClientName: searchTerm,
        ArrhythmiaName: gridFilterByArrhythmia,
        NationalityId: selectedNationality,
        Gender: selectedGender != "All" ? selectedGender : "",
        AgeGroup: selectedAgeGroup,
        AtRisk: gridFilterAtRisk,
        SortBy: "LastVitalsReading",
        SortOrder: "desc"
      }),
      });
  
      const responseJson = await response.json();
      if(!responseJson.IsSuccess){
        console.error("Error fetching Grid data: " + responseJson.Message);
        return;
      }

      const clientsReport: ClientReport = responseJson.Result;

      // Sort records by LastVitalsReading date (newest first) as fallback
      const sortedItems = [...clientsReport.Items].sort((a, b) => {
        const dateA = new Date(a.LastVitalsReading || 0);
        const dateB = new Date(b.LastVitalsReading || 0);
        return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
      });

      setClientsReport({ ...clientsReport, Items: sortedItems });
      setClientRecords(sortedItems);
    }
    catch (error) {
      console.error("Error fetching Grid data:", error)
    }
    finally {
      setGridLoading(false)
    }
  } 
// #endregion
 
// #region Auths Functions 
useEffect(() => {
  // Check for existing auth token on component mount 
  const token = Cookies.get('adminToken'); 
  const userType = Cookies.get('adminType');

  if (token) {
    setIsAuthenticated(true);
  }

  if(userType == "Admin"){
    setIsAdmin(true);
  }
}, []);

 const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      // Replace with your actual API call to authenticate
      const response = await fetch(`${apiUrl}/TokenAuth/Authenticate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userNameOrEmailAddress: username,
          password }),
      });

      if (response.ok) {
        const data = await response.json(); 
        Cookies.set('adminToken', data.AccessToken, { expires: 1 });
        Cookies.set('adminType', data.UserType, { expires: 1 });

        setIsAdmin(data.UserType === 'Admin');
        setIsAuthenticated(true);
      } else {
        setError(t('admin.validation.invalidCredentials'));
      }
    } catch (err) {
      setError(t('common.tryAgain'));
    }
  };

  const handleLogout = () => {
    Cookies.set('adminToken', "", { expires: 1 }); 
    setIsAuthenticated(false);

    router.push('/');
  };
// #endregion 

// #region RequestReading Functions  
  const handleRequestReading = (record: ClientRecord) => {
    setSelectedRecord(record);
    setRequestReadingValidationError("");
    setMessageType("Default");
    setIsRequestReadingOpen(true);
  }
 
  const handleSendRequest = async () => {
      try { 
        setRequestReadingValidationError("");
        if(messageType == "Custom" && requestReadingMessage == ""){
          setRequestReadingValidationError(t('admin.validation.messageRequired'));
          return;
        }

        setIsSendingEmail(true);

        // Create HTML email template
        const htmlTemplate = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${t('admin.email.title')}</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">${t('admin.email.title')}</h1>
                <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 16px;">${t('admin.email.subtitle')}</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <div style="background-color: #f1f5f9; border-left: 4px solid #2563eb; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
                  <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #334155;">
                    ${requestReadingMessage}
                  </p>
                </div>
                
                <!-- Call to Action Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${hostUrl}/" 
                     style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3); transition: all 0.3s ease;">
                    ${t('admin.email.buttonText')}
                  </a>
                </div>
                
                <div style="background-color: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin-top: 30px;">
                  <p style="margin: 0; font-size: 14px; color: #92400e; text-align: center;">
                    <strong>${t('admin.email.importantLabel')}</strong> ${t('admin.email.deviceInstructions')}
                  </p>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 14px; color: #64748b;">
                  ${t('admin.email.providerMessage')}
                </p>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #94a3b8;">
                  ${t('admin.email.copyright')}
                </p>
              </div>
            </div>
          </body>
          </html>
        `;

        const response = await fetch(`${apiUrl}/email/sendEmail`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            receiver: selectedRecord?.Email,
            subject: t('admin.email.subject'),
            text: htmlTemplate,
            IsHtml: true
          }),
        });
  
        const responseJson = await response.json();
  
        if (responseJson.IsSuccess) {
          setIsRequestReadingOpen(false);
          setSelectedRecord(null);
          Swal.fire({ icon: "success", title: t('common.success'), showConfirmButton: false, timer: 1500 });
        } 
        else {
          console.error(responseJson.Message);
          alert(responseJson.Message);
        }
      } 
      catch (error) {
        console.error("Error:", error);
        alert(t('common.error'));
      }
      finally{
        setIsSendingEmail(false);
      }
    };
// #endregion
    
  // Helper function to format date
  function formatDate(dateString: string) {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return dateString;
    }
  } 
  
  const mockConditionSummaries: ArrhythmiaReport = {
    TotalAtRisk: 0,
    TotalRecords: 0,
    Arrhythmias: [
      { ArrhythmiaName: "Atrial Flutter", AtRiskCount: 0, ConfirmedCount: 0, SuspectedCount: 0 },
      { ArrhythmiaName: "Sleep Apnea", AtRiskCount: 0, ConfirmedCount: 0, SuspectedCount: 0 },
      { ArrhythmiaName: "PVC", AtRiskCount: 0, ConfirmedCount: 0, SuspectedCount: 0 },
      { ArrhythmiaName: "Atrial Fibrillation", AtRiskCount: 0, ConfirmedCount: 0, SuspectedCount: 0 },
      { ArrhythmiaName: "Heart Block", AtRiskCount: 0, ConfirmedCount: 0, SuspectedCount: 0 },
      { ArrhythmiaName: "Congestive Heart Failure", AtRiskCount: 0, ConfirmedCount: 0, SuspectedCount: 0 },
      { ArrhythmiaName: "Supraventricular Tachycardia", AtRiskCount: 0, ConfirmedCount: 0, SuspectedCount: 0 },
      { ArrhythmiaName: "Myocardial Infarction", AtRiskCount: 0, ConfirmedCount: 0, SuspectedCount: 0 },
      { ArrhythmiaName: "Sinus Bradycardia", AtRiskCount: 0, ConfirmedCount: 0, SuspectedCount: 0 }
    ]
  }
  
  if (selectedUser) {
    return <UserProfile onBack={() => setSelectedUser(null)} clientId={selectedUser} />
  }

  if (!isAuthenticated) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{t('admin.login')}</h2>
          <Button variant="ghost" onClick={onExit} className="w-full sm:w-auto">
            {t('admin.backToKiosk')}
          </Button>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="login-username">{t('admin.username')}</Label>
              <Input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="login-password">{t('admin.password')}</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full">
              {t('admin.loginButton')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

return ( 
  <div className="min-h-screen bg-gray-50">
    <Dialog open={isRequestReadingOpen} onOpenChange={setIsRequestReadingOpen}>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] background-white">
        <DialogHeader>
          <DialogTitle>{t('requestReading.title')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
                <span className="text-sm font-medium">{t('requestReading.scheduleSend')}</span>
                <Button variant="link" className="text-blue-500 p-0 h-auto">
                  {t('requestReading.viewHistory')}
                </Button>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={sendMethod === "Phone"}
                      onChange={() => setSendMethod("Phone")}
                      className="w-4 h-4 text-blue-600"
                      disabled={true}
                    />
                    <span>{t('requestReading.phone')}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={sendMethod === "Email"}
                      onChange={() => setSendMethod("Email")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>{t('requestReading.email')}</span>
                  </label>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={scheduleType === "Now"}
                      onChange={() => setScheduleType("Now")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>{t('requestReading.now')}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={scheduleType === "Schedule For Later"}
                      onChange={() => setScheduleType("Schedule For Later")}
                      className="w-4 h-4 text-blue-600"
                      disabled={true}
                    />
                    <span>{t('requestReading.scheduleForLater')}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="mb-4">
              <span className="text-sm font-medium">{t('requestReading.message')}</span>
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={messageType === "Default"}
                    onChange={() => {setMessageType("Default"); setRequestReadingMessage(defaultMessage); setRequestReadingValidationError("");}}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>{t('requestReading.default')}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={messageType === "Custom"}
                    onChange={() => {setMessageType("Custom"); setRequestReadingMessage("")}} 
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>{t('requestReading.custom')}</span>
                </label>
              </div>
            </div>
            <div className="relative">
              <textarea
                className="w-full h-24 p-2 border rounded-md"
                maxLength={100}
                value={requestReadingMessage}
                readOnly={messageType === "Default"}
                onChange={(e) => {setRequestReadingMessage(e.target.value); setRequestReadingValidationError("");}} 
              ></textarea>
              <div className="absolute bottom-2 right-2 text-sm text-gray-500">
                {t('admin.labels.maxCharacters')}
              </div>
            </div>
            {requestReadingValidationError && (
              <p className="text-red-500 flex items-center gap-1">
                <AlertCircle size={16} /> {requestReadingValidationError}
              </p>
            )} 
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsRequestReadingOpen(false)}>
            {t('requestReading.cancel')}
          </Button>
          <Button onClick={handleSendRequest} disabled={isSendingEmail}> 
            {isSendingEmail ? t('common.loading') : t('requestReading.send')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <header className="admin-header bg-white shadow-md py-4 px-4 sm:px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={onExit} className="rounded-full">
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">{t('admin.backToKiosk')}</span>
          </Button>
          <h1 className="text-xl sm:text-3xl font-bold text-blue-700">{t('admin.title')}</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={onExit} className="w-full sm:w-auto">
            {t('admin.exitAdminMode')}
          </Button>
          {isAuthenticated && 
            <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
              {t('admin.logout')}
            </Button>
          } 
        </div>
      </div>
    </header>

    <main className="container mx-auto py-6 px-4">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="member-risk" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex flex-col sm:flex-row h-auto">
            <TabsTrigger value="member-risk" className="text-lg py-2 px-4">
              {t('admin.tabs.memberRiskStatus')}
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-lg py-2 px-4">
              {t('admin.tabs.settings')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="member-risk" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="font-medium">{t('admin.filters.nationality')}</label>
                <CountrySelector language="en" value={selectedNationality} onSelect={(id) => { setSelectedNationality(id ?? ""); }} />
              </div>

              <div className="space-y-2">
                <label className="font-medium">{t('admin.filters.gender')}</label>
                <Select value={genderSelectedOption} options={genderOptions} onChange={(option: SingleValue<DropDownOption>) => { setSelectedGender(option?.value || ""); }} />
              </div>

              <div className="space-y-2">
                <label className="font-medium">{t('admin.filters.ageGroup')}</label>
                <Select value={ageGroupSelectedOption} options={ageGroupOptions} onChange={(option: SingleValue<DropDownOption>) => { setSelectedAgeGroup(option?.value || ""); }} />
              </div>

              <div className="space-y-2 sm:col-span-2 md:col-span-1 flex items-end">
                <Button variant="outline" onClick={() => clearFilters()} className="w-full sm:w-auto">
                  {t('admin.filters.reset')}
                </Button>
              </div> 
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-10 gap-4">
              {/* At Risk Card */}
              <Card className="col-span-1 sm:col-span-1 lg:col-span-2 p-3 flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold mb-1">{t('admin.summary.atRisk')}</h3>
                <p className="text-4xl font-bold text-red-500">{totalAtRisk}</p>
                <Button variant="outline" className="mt-3 w-full text-sm">
                  {t('admin.summary.viewAll')}
                </Button>
              </Card>

              {/* Total Card */}
              <Card className="col-span-1 sm:col-span-1 lg:col-span-2 p-3 flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold mb-1">{t('admin.summary.total')}</h3>
                <p className="text-4xl font-bold">{totalRecords}</p>
                <Button variant="outline" className="mt-3 w-full text-sm">
                  {t('admin.summary.viewAll')}
                </Button>
              </Card>

              {/* Condition Cards */}
              {arrhythmiaReport?.Arrhythmias.filter(condition => !collapsedConditions.includes(condition.ArrhythmiaName))
                .map((condition, index) => (
                  <Card key={index} className="col-span-1 sm:col-span-1 lg:col-span-2 p-3">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-lg font-semibold">{getTranslatedConditionName(condition.ArrhythmiaName)}</h3>
                      <button
                        onClick={() => toggleConditionCollapse(condition.ArrhythmiaName)}
                        className="hover:bg-gray-100 rounded-full p-1 transition-colors"
                      >
                        <Minus className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="text-center">
                        <p className="text-xl font-bold text-amber-400">{condition.SuspectedCount || 0}</p>
                        <p className="text-xs text-gray-600">{t('doctor.riskStatus.suspected')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-red-500">{condition.AtRiskCount || 0}</p>
                        <p className="text-xs text-gray-600">{t('doctor.riskStatus.atRisk')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-amber-500">{condition.ConfirmedCount || 0}</p>
                        <p className="text-xs text-gray-600">{t('doctor.riskStatus.confirmed')}</p>
                      </div>
                      <div className="col-span-3">
                        <Button variant="ghost" className="text-blue-500 w-full text-sm py-0.5">
                          {t('doctor.view')}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>

            {collapsedConditions.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">{t('common.collapsed')}</h3>
                <div className="flex flex-wrap gap-2">
                  {arrhythmiaReport?.Arrhythmias.filter(condition => collapsedConditions.includes(condition.ArrhythmiaName))
                    .map((condition, index) => (
                      <button
                        key={index}
                        onClick={() => toggleConditionCollapse(condition.ArrhythmiaName)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-md border hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm font-medium">{getTranslatedConditionName(condition.ArrhythmiaName)}</span>
                        <Plus className="h-3.5 w-3.5 text-teal-500" />
                      </button>
                    ))}
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-12 mb-4">
              <div className="flex items-center space-x-2"> 
                {gridFilterByArrhythmia &&(
                  <Card className="p-3">
                    <span>{t('admin.labels.selectedArrhythmia')} </span> <span>{getTranslatedConditionName(gridFilterByArrhythmia)}</span>
                  </Card> 
                )} 
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full md:w-auto">
                <span className="text-sm sm:text-base">{t('physicians.searchPlaceholder')}</span>
                <Input
                  className="w-full sm:w-64"
                  placeholder={t('physicians.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>



            <div className="overflow-x-auto relative">
              {gridLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
                  <div className="flex flex-col items-center"> 
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                    <span className="text-gray-600">{t('common.loading')}</span>
                  </div>
                </div>
              )}

              <div className="min-w-[1000px]">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">{t('admin.table.memberId')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('admin.table.memberName')}</TableHead> 
                      <TableHead className="whitespace-nowrap">{t('admin.table.lastVitalsReading')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('admin.table.riskCategory')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('admin.table.riskLevel')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('admin.table.bloodPressure')}</TableHead> 
                      <TableHead className="whitespace-nowrap">{t('admin.table.heartRate')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('admin.table.heartRateVariability')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('admin.table.respirationRate')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('admin.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientRecords.length > 0 ? (
                      clientRecords.map((record) => (
                        <TableRow
                          key={record.ClientId}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <TableCell onClick={() => record.ClientName && setSelectedUser(record.ClientId)}>{record.ClientId}</TableCell>
                          <TableCell className="font-medium" onClick={() => record.ClientName && setSelectedUser(record.ClientId)}>{record.ClientName || t('common.anonymous')}</TableCell>
                          <TableCell onClick={() => record.ClientName && setSelectedUser(record.ClientId)}>{formatDate(record.LastVitalsReading)}</TableCell>
                          <TableCell onClick={() => record.ClientName && setSelectedUser(record.ClientId)}>
                            {record.RiskCategories.length > 0 ? (
                              record.RiskCategories.map((category, index) => (
                                <span className="flex mt-2" key={index}>{category.RiskCategory}</span>
                              ))
                            ) : "-"} 
                          </TableCell>
                          <TableCell onClick={() => record.ClientName && setSelectedUser(record.ClientId)}>
                            {record.RiskCategories.length > 0 ? (
                              record.RiskCategories.map((category, index) => (
                                <span
                                  key={index}
                                  className={`flex mt-2 px-2 py-1 rounded text-white ${category.RiskLevel === "HighRisk"
                                    ? "bg-red-500"
                                    : category.RiskLevel === "Suspected"
                                      ? "bg-amber-500"
                                      : "bg-green-500"
                                    }`}
                                >
                                  {category.RiskLevel == "HighRisk" ? t('admin.riskLevels.high') : category.RiskLevel == "Suspected" ? t('doctor.riskStatus.suspected') : t('admin.riskLevels.low')}
                                </span>
                              ))
                            ) : (
                              <span className={`px-2 py-1 rounded text-white bg-green-500`} >
                                {t('admin.riskLevels.low')}
                              </span>
                            )}  
                          </TableCell>
                          <TableCell onClick={() => record.ClientName && setSelectedUser(record.ClientId)}>{record.BloodPressure}</TableCell> 
                          <TableCell onClick={() => record.ClientName && setSelectedUser(record.ClientId)}>
                            <div className="flex items-center justify-start">
                              <span>{record.HeartRate}</span>
                              {record.HeartRate > 100 && <ArrowUp className="ml-1 h-4 w-4 text-red-500" />}
                              {record.HeartRate < 60 && <ArrowDown className="ml-1 h-4 w-4 text-green-500" />}
                              {(record.HeartRate > 60 && record.HeartRate < 100) && <Minus className="ml-1 h-4 w-4 text-gray-500" />}
                            </div>
                          </TableCell>
                          <TableCell onClick={() => record.ClientName && setSelectedUser(record.ClientId)}>
                            <div className="flex items-center justify-start">
                              <span>{record.HeartRateVariability}</span>
                              {record.Trend === "up" && <ArrowUp className="ml-1 h-4 w-4 text-red-500" />}
                              {record.Trend === "down" && <ArrowDown className="ml-1 h-4 w-4 text-green-500" />}
                              {record.Trend === "stable" && <Minus className="ml-1 h-4 w-4 text-gray-500" />}
                            </div>
                          </TableCell>
                          <TableCell onClick={() => record.ClientName && setSelectedUser(record.ClientId)}>
                            <div className="flex items-center justify-start">
                              <span>{record.RespirationRate}</span>
                              {record.RespirationRate > 20 && <ArrowUp className="ml-1 h-4 w-4 text-red-500" />}
                              {record.RespirationRate < 12 && <ArrowDown className="ml-1 h-4 w-4 text-green-500" />}
                              {(record.RespirationRate > 12 && record.RespirationRate < 20) && <Minus className="ml-1 h-4 w-4 text-gray-500" />}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="link"
                              className="text-blue-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRequestReading(record);
                              }}
                            >
                              {t('admin.table.requestReading')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                          {t('common.noRecords')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="admin-pagination flex flex-col lg:flex-row items-center justify-between mt-4 gap-4">
                <div className="text-sm text-gray-600">
                  {t('admin.pagination.showing')} {indexOfFirstItem + 1}-{ Math.min(indexOfLastItem, clientRecords.length) < itemsPerPage ? clientsReport?.TotalItemsCount : Math.min(indexOfLastItem, clientRecords.length)} {t('admin.pagination.of')} {clientsReport?.TotalItemsCount} {t('admin.pagination.records')}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                      className="px-2 sm:px-4"
                    >
                      {t('admin.pagination.first')}
                    </Button>

                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                      className="px-2 sm:px-4"
                    >
                      {t('admin.pagination.previous')}
                    </Button>
                  </div>

                  {/* Page numbers */}
                  <div className="flex gap-1 overflow-x-auto py-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Show pages around current page
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          onClick={() => setCurrentPage(pageNum)}
                          className="min-w-[40px]"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="px-2 sm:px-4"
                    >
                      {t('admin.pagination.next')}
                    </Button>

                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      className="px-2 sm:px-4"
                    >
                      {t('admin.pagination.last')}
                    </Button>
                  </div>

                  {/* Items per page selector */}
                  <Select
                    value={{ value: itemsPerPage, label: `${itemsPerPage} ${t('admin.pagination.perPage')}` }}
                    options={[5, 10, 20, 50].map(num => ({
                      value: num,
                      label: `${num} ${t('admin.pagination.perPage')}`
                    }))}
                    onChange={(option) => {
                      setItemsPerPage(option?.value || 10);
                      setCurrentPage(1); // Reset to first page when changing page size
                    }}
                    className="w-full sm:w-32 ml-0 sm:ml-2"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4">{t('admin.tabs.settings')}</h2>
              {isAdmin && <PhysiciansGrid />} 
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </main>
  </div> 
)
}
