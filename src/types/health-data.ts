export interface HealthData {
    CardiacStress: number;
    coronary_death_risk: number | null;
    cv_mortality_risk: number | null;
    DiastolicBloodPressure: number | null;
    fatal_stroke_risk: number | null;
    hard_cv_event_risk: number | null;
    HeartRate4s: number;
    HeartRate10s: number;
    HrvSdnn: number;
    Id: number;
    RealTimeHeartRate: number;
    SystolicBloodPressure: number | null;
    Timestamp: string; // ISO 8601 date string
    ClientId: string;
    HrvSdnnMs: number;
    SystolicBloodPressureMmhg: number;
    DiastolicBloodPressureMmhg: number;
    BreathingRate: number
    HealthConcern: string[];
    VitalSigns: {
        name: string;
        value: string;
        normalRange: string;
        status: string;
    }[];
}