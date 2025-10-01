"use client"

import { useTranslation } from "@/hooks/useTranslation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
      icon: <Hand className="w-12 h-12 text-blue-600" />,
      title: t('fingerprintScan.instructions.step1.title'),
      description: t('fingerprintScan.instructions.step1.desc')
    },
    {
      icon: <Camera className="w-12 h-12 text-green-600" />,
      title: t('fingerprintScan.instructions.step2.title'),
      description: t('fingerprintScan.instructions.step2.desc')
    },
    {
      icon: <Timer className="w-12 h-12 text-orange-600" />,
      title: t('fingerprintScan.instructions.step3.title'),
      description: t('fingerprintScan.instructions.step3.desc')
    },
    {
      icon: <CheckCircle className="w-12 h-12 text-purple-600" />,
      title: t('fingerprintScan.instructions.step4.title'),
      description: t('fingerprintScan.instructions.step4.desc')
    }
  ]

  return (
    <div className="h-full flex flex-col" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 p-8">
        <h1 className="text-3xl font-bold mb-4 text-center">
          {t('fingerprintScan.instructions.title')}
        </h1>
        <p className="text-lg text-gray-600 mb-8 text-center">
          {t('fingerprintScan.instructions.subtitle')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {instructions.map((instruction, index) => (
            <Card
              key={index}
              className="p-6 hover:shadow-lg transition-shadow animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  {instruction.icon}
                </div>
                <h3 className="text-xl font-semibold">{instruction.title}</h3>
                <p className="text-gray-600">{instruction.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Sticky Button Area */}
      <div className="flex-shrink-0 pt-4 px-8 pb-8">
        <div className="flex justify-between max-w-4xl mx-auto">
          <Button onClick={onBack} variant="outline" size="lg">
            {t('buttons.back')}
          </Button>
          <Button onClick={onStart} size="lg" className="bg-green-600 hover:bg-green-700">
            {t('buttons.startScan')}
          </Button>
        </div>
      </div>
    </div>
  )
}
