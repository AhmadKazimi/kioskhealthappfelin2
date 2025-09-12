/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import HealthSummaryModal from "@/components/health-summary-modal";
import { ClientModel } from "@/payload-types"; 
import Cookies from 'js-cookie';

// interface SuggestedCare {
//   level: string;
//   message: string;
//   timestamp: number;
// }

export type UserData = {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    consent: boolean;
  } | null;
  age: string;
  gender: string;
  vitals: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    oxygenSaturation: number;
  } | null;
  complaint: string;
};
  
export default function HealthSummaryScreen() {
  const [apiData, setApiData] = useState<null | ClientModel>(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  const searchParams = useSearchParams(); 
  const clientId = searchParams.get("clientId"); 

  // const [suggestedCare, setSuggestedCare] = useState<SuggestedCare | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {  
    Cookies.set('userId', clientId ?? "", { expires: 1 }); 

    const fetchData = async () => {
      try {
        setIsLoading(true); 
        const response = await fetch(`${apiUrl}/client/GetClient?id=${clientId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        });

        const responseJson = await response.json();
        if (!responseJson.IsSuccess) {
          throw new Error("Failed to fetch data");
        } 
 
        const data: ClientModel = responseJson.Result; 
        setApiData(data);
        setIsError(false);  
      } 
      catch (error) {
        console.error("Error fetching data:", error);
        setIsError(true);
      } 
      finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {!isError && !isLoading && apiData && (
        <HealthSummaryModal
          isOpen={true}
          onClose={() => {}}
          userData={apiData} 
          //recommendation={suggestedCare}
        />
      )}
    </div>
  );
}
