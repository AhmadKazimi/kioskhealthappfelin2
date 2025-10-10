"use client"

import { useState } from "react"
import { BeforeFingerprintScanning } from "@/components/New pages/beforeFingerprintScanning"
import { FingerprintScanScreen } from "@/components/fingerprint-scan-screen"

interface FingerprintWorkflowProps {
  userId: string
  userEmail: string
  userAge: number
  userGender: 'male' | 'female'
  onBack: () => void
  onNext: () => void
}

/**
 * Combined Fingerprint Workflow Component
 * Manages both instruction view and scanning view within a single step
 * This prevents the step indicator from incrementing between instructions and scanning
 */
export const FingerprintWorkflow = ({
  userId,
  userEmail,
  userAge,
  userGender,
  onBack,
  onNext
}: FingerprintWorkflowProps) => {
  // Internal state to toggle between instructions and scanning
  const [showInstructions, setShowInstructions] = useState(true)

  if (showInstructions) {
    return (
      <BeforeFingerprintScanning
        onBack={onBack}
        onStart={() => setShowInstructions(false)}
      />
    )
  }

  return (
    <FingerprintScanScreen
      userId={userId}
      userEmail={userEmail}
      userAge={userAge}
      userGender={userGender}
      onBack={() => setShowInstructions(true)}
      onNext={onNext}
    />
  )
}

