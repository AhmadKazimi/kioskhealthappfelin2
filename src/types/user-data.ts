export interface UserData {
    personalInfo?: {
      fullName: string;
      email: string;
      phone: string;
      consent: boolean;
      age?: string;
      gender?: string;
    };
    vitals?: {
      heartRate: number;
      bloodPressure: string;
      temperature: number;
      oxygenSaturation: number;
      systolicBP?: string;
      diastolicBP?: string;
    };
    complaint?: string;
  }