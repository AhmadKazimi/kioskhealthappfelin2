/* eslint-disable @typescript-eslint/no-unused-vars */

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CircleIcon as CircleNotch, Check, ArrowLeft, Heart, Activity, ArrowRight } from "lucide-react" 
import ShenaiScanner from "@/components/ShenaiScanner"
import { useTranslation } from "@/hooks/useTranslation"

// Types
interface FaceScanScreenProps { 
  onPrev: () => void
  onNext: () => void
} 

interface VitalsData {
  heartRate: number
  bloodPressure: string
  temperature: number
  oxygenSaturation: number
}

// Constants
const COUNTDOWN_DURATION = 5
const RESULTS_DELAY = 1000

// Sub-components
const ScanResults = ({ vitals, onPrev, onNext }: { 
  vitals: VitalsData
  onPrev: () => void
  onNext: () => void 
}) => {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-6 lg:space-y-8">
          {/* Success Header */}
          <div className="space-y-3 lg:space-y-4">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6">
              <Check className="w-8 h-8 lg:w-12 lg:h-12 text-green-600" />
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-blue-800 mb-3 lg:mb-4">
              {t('faceScan.scanComplete')}
            </h2>
            <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              {t('faceScan.scanCompleteSubtitle')}
            </p>
          </div>

          {/* Vitals Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 lg:mb-12 px-4">
            <VitalCard
              icon={<Heart className="w-6 h-6  text-red-600" />}
              iconBg="bg-red-100"
              label={t('faceScan.vitals.heartRate')}
              value={`${vitals.heartRate} ${t('faceScan.vitals.bpm')}`}
            />
            <VitalCard
              icon={<Activity className="w-6 h-6  text-blue-600" />}
              iconBg="bg-blue-100"
              label={t('faceScan.vitals.bloodPressure')}
              value={vitals.bloodPressure}
            />
            <VitalCard
              icon={<div className="w-6 h-6  bg-yellow-500 rounded-full" />}
              iconBg="bg-yellow-100"
              label={t('faceScan.vitals.temperature')}
              value={`${vitals.temperature}°C`}
            />
            <VitalCard
              icon={<div className="w-6 h-6  bg-green-500 rounded-full" />}
              iconBg="bg-green-100"
              label={t('faceScan.vitals.oxygen')}
              value={`${vitals.oxygenSaturation}%`}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col lg:flex-row justify-between gap-4 lg:gap-0 pt-6 lg:pt-8 px-4">
          <Button 
            onClick={onPrev} 
            className="text-lg lg:text-xl py-4 lg:py-6 px-8 lg:px-12 bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2 w-full lg:w-auto"
          >
            {isArabic ? (
              <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6" />
            ) : (
              <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6" />
            )}
            {t('buttons.back')}
          </Button>
          <Button 
            onClick={onNext} 
            className="text-lg lg:text-xl py-4 lg:py-6 px-8 lg:px-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 w-full lg:w-auto"
          >
            {t('buttons.continue')}
          </Button>
        </div>
      </div>
    </div>
  )
}

const VitalCard = ({ icon, iconBg, label, value }: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
}) => (
  <Card className="p-4 lg:p-8 bg-white shadow-lg border-0 rounded-2xl hover:shadow-xl transition-shadow duration-300">
    <div className={`flex items-center justify-center w-12 h-12 lg:w-16 lg:h-16 ${iconBg} rounded-full mx-auto mb-3 lg:mb-4`}>
      {icon}
    </div>
    <p className="text-sm lg:text-lg text-gray-600 mb-2">{label}</p>
    <p className="text-2xl lg:text-4xl font-bold text-blue-800">{value}</p>
  </Card>
)

const ScannerInterface = ({ onPrev, onNext, scanning, showResults }: {
  onPrev: () => void
  onNext: () => void
  scanning: boolean
  showResults: boolean
}) => {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  
  return (
    <div className="lg:min-h-screen p-4 lg:p-6">
      <div className="max-w-7xl mx-auto h-screen lg:h-[80vh] flex flex-col">
        {/* Header */}
        <div className="text-center space-y-2 mb-1 lg:mb-2 flex-shrink-0">
          <h2 className="text-2xl lg:text-5xl font-bold text-blue-800">
            {t('faceScan.title')}
          </h2>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row flex-1 items-center justify-between space-y-4 lg:space-y-0 lg:space-x-8 w-full min-h-0">
          {/* Left Side - Back Button */}
          <div className="w-full lg:w-1/6 flex items-center justify-center order-2 lg:order-1 flex-shrink-0">
            <Button
              onClick={onPrev}
              disabled={scanning}
              className="text-base lg:text-lg py-3 lg:py-4 px-6 lg:px-8 bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 w-full lg:w-auto"
            >
              {isArabic ? (
                <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
              ) : (
                <ArrowLeft className="w-4 h-4 lg:w-5 lg:h-5" />
              )}
              {t('buttons.back')}
            </Button> 
          </div>

          {/* Center - Scanner */}
          <div className="w-full lg:w-4/6 flex flex-col items-center justify-center order-1 lg:order-2 flex-1 min-h-0">
            <div className="relative w-full h-full max-h-[60vh] lg:max-h-none">
              <div className="relative w-full h-full">
                <div className="relative h-full">
                  <div className="relative z-10 h-full">
                    <ShenaiScanner onScanComplete={() => {
                      setShowResults(true);
                      // Automatically move to next step after scan completion
                      setTimeout(() => {
                        onNext();
                      }, 2000); // Give user 2 seconds to see the scan completed
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Next Button */}
          <div className="w-full lg:w-1/6 flex items-center justify-center order-3 flex-shrink-0">
          {showResults && (<button 
              type="button"
              onClick={onNext}
              disabled={scanning}
              className={`cursor-pointer group relative flex items-center justify-center space-x-2 px-4 md:px-6 py-2 md:py-3
                       text-sm md:text-base font-medium text-white bg-gradient-to-r from-[#407EFF] to-[#1E40AF]
                       rounded-xl shadow-lg
                       transition-all duration-300 ease-out
                       hover:shadow-xl hover:scale-[1.02] hover:from-[#1E40AF] hover:to-[#407EFF]
                       focus:outline-none focus:ring-4 focus:ring-[#407EFF]/30
                       active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg
                       w-full lg:w-auto`}
            >
              {scanning ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t('buttons.loading')}</span>
                </div>
              ) : (
                <>
                  <span>{t('buttons.next')}</span>
                  {isArabic ? (
                    <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:-translate-x-1" />
                  ) : (
                    <ArrowRight className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:translate-x-1" />
                  )}
                </>
              )}
            </button>)}
          </div>
        </div>
      </div>
    </div>
  )
}

// Main Component
export default function FaceScanScreen({ onPrev, onNext }: FaceScanScreenProps) {
  const [scanning, setScanning] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION)
  const [scanComplete, setScanComplete] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [vitals, setVitals] = useState<VitalsData>({
    heartRate: 0,
    bloodPressure: "",
    temperature: 0,
    oxygenSaturation: 0,
  })

  // Effects
  useEffect(() => {
    if (scanning && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (scanning && countdown === 0) {
      setScanComplete(true)
      setScanning(false)

      // Generate sample readings
      const sampleVitals: VitalsData = {
        heartRate: Math.floor(Math.random() * (100 - 60) + 60),
        bloodPressure: `${Math.floor(Math.random() * (140 - 110) + 110)}/${Math.floor(Math.random() * (90 - 70) + 70)}`,
        temperature: Number.parseFloat((Math.random() * (37.5 - 36.5) + 36.5).toFixed(1)),
        oxygenSaturation: Math.floor(Math.random() * (100 - 95) + 95),
      }

      setVitals(sampleVitals)

      // Show results after a short delay
      const timer = setTimeout(() => {
        setShowResults(true)
      }, RESULTS_DELAY)
      return () => clearTimeout(timer)
    }
  }, [scanning, countdown])

  // Event Handlers
  const startScan = () => {
    setScanning(true)
  }

  const handleContinue = () => {
    onNext()
  }

  // Render Results or Scanner
  if (showResults) {
    return (
      <ScanResults
        vitals={vitals}
        onPrev={onPrev}
        onNext={handleContinue}
      />
    )
  }

  return (
    <ScannerInterface
      onPrev={onPrev}
      onNext={handleContinue}
      scanning={scanning}
      showResults={showResults}
    />
  )
}