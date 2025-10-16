"use client"

import { useState } from "react"
import { ScanTypeSelection } from "@/components/scan-type-selection"
import { BeforeFingerprintScanning } from "@/components/New pages/beforeFingerprintScanning"
import { FingerprintScanScreen } from "@/components/fingerprint-scan-screen"
import BeforeScanning from "@/components/New pages/beforeScanning"
import FaceScanScreen from "@/components/face-scan-screen"

interface ScanningWorkflowProps {
  userId: string
  userEmail: string
  userAge: number
  userGender: 'male' | 'female'
  onBack: () => void
  onNext: () => void
  // Update local user data with measured vitals so summary doesn't depend on API
  updateUserData?: (data: Partial<{
    vitals: {
      heartRate: number;
      bloodPressure: string;
      breathingRate: number;
      hrvSdnnMs: number;
      systolicBP: number;
      diastolicBP: number;
      oxygenSaturation?: number;
      temperature?: number;
    }
  }>) => void
}

type ScanType = 'face' | 'fingerprint' | null
type WorkflowView = 'selection' | 'instructions' | 'scanning'

/**
 * Unified Scanning Workflow Component
 * Manages the entire scanning process within a single step:
 * 1. Scan type selection (face vs fingerprint)
 * 2. Instructions for the selected scan type
 * 3. Actual scanning
 * 
 * The step counter only increments when the scan is complete and user clicks Next
 */
export const ScanningWorkflow = ({
  userId,
  userEmail,
  userAge,
  userGender,
  onBack,
  onNext,
  updateUserData
}: ScanningWorkflowProps) => {
  const [currentView, setCurrentView] = useState<WorkflowView>('selection')
  const [scanType, setScanType] = useState<ScanType>(null)

  // Handler for when user selects scan type
  const handleScanTypeSelect = (type: 'face' | 'fingerprint') => {
    setScanType(type)
    setCurrentView('instructions')
  }

  // Handler for going back from instructions to selection
  const handleBackToSelection = () => {
    setCurrentView('selection')
    setScanType(null)
  }

  // Handler for starting the scan from instructions
  const handleStartScan = () => {
    setCurrentView('scanning')
  }

  // Handler for going back from scanning to instructions
  const handleBackToInstructions = () => {
    setCurrentView('instructions')
  }

  // Render based on current view
  switch (currentView) {
    case 'selection':
      return (
        <ScanTypeSelection
          onSelectScanType={handleScanTypeSelect}
          onBack={onBack}
        />
      )

    case 'instructions':
      if (scanType === 'fingerprint') {
        return (
          <BeforeFingerprintScanning
            onBack={handleBackToSelection}
            onStart={handleStartScan}
          />
        )
      } else {
        return (
          <BeforeScanning
            onNext={handleStartScan}
            onPrev={handleBackToSelection}
          />
        )
      }

    case 'scanning':
      if (scanType === 'fingerprint') {
        return (
          <FingerprintScanScreen
            userId={userId}
            userEmail={userEmail}
            userAge={userAge}
            userGender={userGender}
            onBack={handleBackToInstructions}
            onNext={onNext} // Only this advances to the next step
            onLocalResults={(r) => {
              updateUserData?.({
                vitals: {
                  heartRate: r.heartRate,
                  breathingRate: r.breathingRate,
                  hrvSdnnMs: r.hrvSdnnMs,
                  systolicBP: r.systolicBP,
                  diastolicBP: r.diastolicBP,
                  oxygenSaturation: r.oxygenSaturation ?? 0,
                  temperature: r.temperature ?? 0,
                  bloodPressure: r.bloodPressure,
                }
              });
            }}
          />
        )
      } else {
        return (
          <FaceScanScreen
            onNext={onNext} // Only this advances to the next step
            onPrev={handleBackToInstructions}
            onLocalResults={(r) => {
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('📊 FACE SCAN - Received Local Results in Workflow');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('Results:', JSON.stringify(r, null, 2));
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

              updateUserData?.({
                vitals: {
                  heartRate: r.heartRate,
                  breathingRate: r.breathingRate,
                  hrvSdnnMs: r.hrvSdnnMs,
                  systolicBP: r.systolicBP,
                  diastolicBP: r.diastolicBP,
                  oxygenSaturation: 0, // Face scan doesn't measure SpO2
                  temperature: 0, // Face scan doesn't measure temperature
                  bloodPressure: r.bloodPressure,
                }
              });

              console.log('✅ Updated userData with face scan vitals');
            }}
          />
        )
      }

    default:
      return null
  }
}

