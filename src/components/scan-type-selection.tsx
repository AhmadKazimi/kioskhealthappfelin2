"use client"

import { useTranslation } from "@/hooks/useTranslation"
import { Card } from "@/components/ui/card"
import { Camera, Fingerprint } from "lucide-react"

interface ScanTypeSelectionProps {
  onSelectScanType: (type: 'face' | 'fingerprint') => void
}

export const ScanTypeSelection = ({ onSelectScanType }: ScanTypeSelectionProps) => {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  return (
    <div className="h-full flex flex-col items-center justify-center p-8" dir={isArabic ? 'rtl' : 'ltr'}>
      <h1 className="text-3xl font-bold mb-8 text-center">
        {t('scanType.title')}
      </h1>
      <p className="text-lg text-gray-600 mb-12 text-center max-w-2xl">
        {t('scanType.subtitle')}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Face Scan Card */}
        <Card
          className="p-8 cursor-pointer hover:shadow-xl transition-all hover:scale-105 border-2 hover:border-blue-500"
          onClick={() => onSelectScanType('face')}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <Camera className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold">{t('scanType.faceScan')}</h2>
            <p className="text-gray-600">{t('scanType.faceScanDesc')}</p>
          </div>
        </Card>

        {/* Fingerprint Scan Card */}
        <Card
          className="p-8 cursor-pointer hover:shadow-xl transition-all hover:scale-105 border-2 hover:border-green-500"
          onClick={() => onSelectScanType('fingerprint')}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <Fingerprint className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold">{t('scanType.fingerprintScan')}</h2>
            <p className="text-gray-600">{t('scanType.fingerprintScanDesc')}</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
