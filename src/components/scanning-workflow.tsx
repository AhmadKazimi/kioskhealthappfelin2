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
  onNext
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
          />
        )
      } else {
        return (
          <FaceScanScreen
            onNext={onNext} // Only this advances to the next step
            onPrev={handleBackToInstructions}
          />
        )
      }

    default:
      return null
  }
}

