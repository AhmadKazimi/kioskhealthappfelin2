"use client"

import { useTranslation } from "@/hooks/useTranslation"
import { Hand, Camera, Timer, CheckCircle } from "lucide-react"

interface BeforeFingerprintScanningProps {
  onBack: () => void
  onStart: () => void
}

export const BeforeFingerprintScanning = ({
  onBack,
  onStart
}: BeforeFingerprintScanningProps) => {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  const instructions = [
    {
      icon: <Hand className="w-8 h-8 text-[#407EFF]" />,
      title: t('fingerprintScan.instructions.step1.title'),
      description: t('fingerprintScan.instructions.step1.desc')
    },
    {
      icon: <Camera className="w-8 h-8 text-[#407EFF]" />,
      title: t('fingerprintScan.instructions.step2.title'),
      description: t('fingerprintScan.instructions.step2.desc')
    },
    {
      icon: <Timer className="w-8 h-8 text-[#407EFF]" />,
      title: t('fingerprintScan.instructions.step3.title'),
      description: t('fingerprintScan.instructions.step3.desc')
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-[#407EFF]" />,
      title: t('fingerprintScan.instructions.step4.title'),
      description: t('fingerprintScan.instructions.step4.desc')
    }
  ]

  return (
    <div className="h-full flex flex-col" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-6 py-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center text-[#407EFF]">
          {t('fingerprintScan.instructions.title')}
        </h1>
        <p className="text-sm md:text-base text-gray-600 mb-6 text-center">
          {t('fingerprintScan.instructions.subtitle')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 max-w-4xl mx-auto">
          {instructions.map((instruction, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-4"
              style={{ boxShadow: '0px 4px 10px 0px rgba(64, 126, 255, 0.20)' }}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                  {instruction.icon}
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">{instruction.title}</h3>
                <p className="text-xs md:text-sm text-gray-600">{instruction.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Button Area */}
      <div className="flex-shrink-0 pt-4 px-4 sm:px-6 pb-6">
        <div className="flex justify-between gap-4 max-w-4xl mx-auto">
          <button 
            onClick={onBack}
            className="group relative flex items-center justify-center px-4 md:px-6 py-2 md:py-3 
                     text-sm md:text-base font-medium text-gray-700 bg-white border-2 border-gray-300
                     rounded-xl shadow-lg
                     transition-all duration-300 ease-out
                     hover:bg-gray-50 hover:shadow-xl
                     focus:outline-none focus:ring-4 focus:ring-gray-300/30"
          >
            {t('buttons.back')}
          </button>
          <button
            onClick={onStart}
            className="group relative flex items-center justify-center space-x-2 px-4 md:px-6 py-2 md:py-3
                     text-sm md:text-base font-medium text-white bg-gradient-to-r from-[#407EFF] to-[#1E40AF]
                     rounded-xl shadow-lg
                     transition-all duration-300 ease-out
                     hover:shadow-xl hover:scale-[1.02] hover:from-[#1E40AF] hover:to-[#407EFF]
                     focus:outline-none focus:ring-4 focus:ring-[#407EFF]/30
                     active:scale-[0.98]"
          >
            <span>{t('fingerprintScan.startButton')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
