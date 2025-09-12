'use client'

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import FastScanScanner from '@/components/FastScanScanner';
import { useTranslation } from '@/hooks/useTranslation';
import LanguageSwitcher from '@/components/language-switcher';
import { type ScanResults } from '@/types/global';

export default function FastScanPage() {
  const { t } = useTranslation();
  const [scanResults, setScanResults] = useState<ScanResults | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleScanComplete = (results: ScanResults) => {
    console.log('Scan completed with results:', results);
    setScanResults(results);
    setErrorMessage('');
  };

  const handleScanError = (error: string) => {
    console.error('Scan error:', error);
    setErrorMessage(error);
  };

  const handleStartNewScan = () => {
    setScanResults(null);
    setErrorMessage('');
    
    // Reset the SDK to measurement screen without re-initializing
    if (window.shenai && window.shenai.isInitialized()) {
      try {
        // Go back to measurement screen to start new scan
        window.shenai.setScreen(window.shenai.Screen.MEASUREMENT);
        console.log('SDK reset to measurement screen for new scan');
      } catch (error) {
        console.warn('Could not reset SDK screen:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Language Switcher */}
        <div className="mb-8 text-center relative">
          <div className="absolute top-0 right-0">
            <LanguageSwitcher />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('fastScan.pageTitle')}
          </h1>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 flex justify-center">
            <Alert className="max-w-2xl border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {errorMessage}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Success Alert */}
        {scanResults && (
          <div className="mb-6 flex justify-center">
            <Alert className="max-w-2xl border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {t('fastScan.successMessage')}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 justify-center">
          {/* Scanner Section */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="mb-4 text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {t('fastScan.scannerTitle')}
                </h2>
                <p className="text-gray-600">
                  {t('fastScan.scannerDescription')}
                </p>
              </div>
              
              <FastScanScanner 
                onScanComplete={handleScanComplete}
                onError={handleScanError}
              />
              
              {scanResults && (
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={handleStartNewScan}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {t('fastScan.startNewScan')}
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Information & Results Section */}
          <div className="space-y-6">
            {/* Instructions */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                {t('fastScan.guideTitle')}
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">1.</span>
                  {t('fastScan.instructions.step1')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">2.</span>
                  {t('fastScan.instructions.step2')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">3.</span>
                  {t('fastScan.instructions.step3')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">4.</span>
                  {t('fastScan.instructions.step4')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">5.</span>
                  {t('fastScan.instructions.step5')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">6.</span>
                  {t('fastScan.instructions.step6')}
                </li>
              </ul>
            </Card>

            {/* Results Card */}
            {scanResults && (
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                  {t('fastScan.resultsTitle')}
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {/* Primary Vitals */}
                  {scanResults.realtimeHeartRate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('fastScan.metrics.heartRate')}:</span>
                      <span className="font-semibold">{scanResults.realtimeHeartRate} {t('fastScan.units.bpm')}</span>
                    </div>
                  )}
                  {scanResults.systolicBloodPressureMmhg && scanResults.diastolicBloodPressureMmhg && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('fastScan.metrics.bloodPressure')}:</span>
                      <span className="font-semibold">
                        {scanResults.systolicBloodPressureMmhg}/{scanResults.diastolicBloodPressureMmhg} {t('fastScan.units.mmhg')}
                      </span>
                    </div>
                  )}
                  {scanResults.breathingRate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('fastScan.metrics.breathingRate')}:</span>
                      <span className="font-semibold">{scanResults.breathingRate} {t('fastScan.units.bpm')}</span>
                    </div>
                  )}
                  
                  {/* Heart Rate Variability */}
                  {scanResults.hrvSdnnMs && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('fastScan.metrics.hrvSdnn')}:</span>
                      <span className="font-semibold">{scanResults.hrvSdnnMs} {t('fastScan.units.ms')}</span>
                    </div>
                  )}
                  {scanResults.hrvLnrmssdMs && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('fastScan.metrics.hrvLnrmssd')}:</span>
                      <span className="font-semibold">{scanResults.hrvLnrmssdMs} {t('fastScan.units.ms')}</span>
                    </div>
                  )}
                  
                  {/* Stress & Autonomic Metrics */}
                  {scanResults.cardiacStress && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('fastScan.metrics.cardiacStress')}:</span>
                      <span className="font-semibold">{scanResults.cardiacStress}</span>
                    </div>
                  )}
                  {scanResults.stressIndex && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('fastScan.metrics.stressIndex')}:</span>
                      <span className="font-semibold">{scanResults.stressIndex}</span>
                    </div>
                  )}
                  {scanResults.parasympatheticActivity && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('fastScan.metrics.parasympatheticActivity')}:</span>
                      <span className="font-semibold">{scanResults.parasympatheticActivity}</span>
                    </div>
                  )}
                  
                  {/* Cardiac Performance */}
                  {scanResults.cardiacWorkload && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('fastScan.metrics.cardiacWorkload')}:</span>
                      <span className="font-semibold">{scanResults.cardiacWorkload} {t('fastScan.units.mmhgPerSec')}</span>
                    </div>
                  )}
                  
                  {/* Body Metrics */}
                  {scanResults.ageYears && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('fastScan.metrics.estimatedAge')}:</span>
                      <span className="font-semibold">{scanResults.ageYears} {t('fastScan.units.years')}</span>
                    </div>
                  )}
                  {scanResults.bmiKgPerM2 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('fastScan.metrics.bmi')}:</span>
                      <span className="font-semibold">{scanResults.bmiKgPerM2} {t('fastScan.units.kgPerM2')}</span>
                    </div>
                  )}
                  {scanResults.weightKg && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('fastScan.metrics.estimatedWeight')}:</span>
                      <span className="font-semibold">{scanResults.weightKg} {t('fastScan.units.kg')}</span>
                    </div>
                  )}
                  {scanResults.heightCm && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('fastScan.metrics.estimatedHeight')}:</span>
                      <span className="font-semibold">{scanResults.heightCm} {t('fastScan.units.cm')}</span>
                    </div>
                  )}
                  
                  {/* Health Indices */}
                  {scanResults.wellnessScore && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('fastScan.metrics.wellnessScore')}:</span>
                      <span className="font-semibold">{scanResults.wellnessScore}{t('fastScan.units.outOf100')}</span>
                    </div>
                  )}
                  {scanResults.vascularAge && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('fastScan.metrics.vascularAge')}:</span>
                      <span className="font-semibold">{scanResults.vascularAge} {t('fastScan.units.years')}</span>
                    </div>
                  )}
                  {scanResults.waistToHeightRatio && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('fastScan.metrics.waistToHeightRatio')}:</span>
                      <span className="font-semibold">{scanResults.waistToHeightRatio.toFixed(3)}</span>
                    </div>
                  )}
                  {scanResults.bodyFatPercentage && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('fastScan.metrics.bodyFatPercentage')}:</span>
                      <span className="font-semibold">{scanResults.bodyFatPercentage.toFixed(1)}{t('fastScan.units.percent')}</span>
                    </div>
                  )}
                  {scanResults.basalMetabolicRate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('fastScan.metrics.basalMetabolicRate')}:</span>
                      <span className="font-semibold">{scanResults.basalMetabolicRate} {t('fastScan.units.calPerDay')}</span>
                    </div>
                  )}
                  {scanResults.totalDailyEnergyExpenditure && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('fastScan.metrics.totalDailyEnergyExpenditure')}:</span>
                      <span className="font-semibold">{scanResults.totalDailyEnergyExpenditure} {t('fastScan.units.calPerDay')}</span>
                    </div>
                  )}
                  {scanResults.hypertensionRisk && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('fastScan.metrics.hypertensionRisk')}:</span>
                      <span className="font-semibold">{(scanResults.hypertensionRisk * 100).toFixed(1)}{t('fastScan.units.percent')}</span>
                    </div>
                  )}
                  {scanResults.diabetesRisk && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('fastScan.metrics.diabetesRisk')}:</span>
                      <span className="font-semibold">{(scanResults.diabetesRisk * 100).toFixed(1)}{t('fastScan.units.percent')}</span>
                    </div>
                  )}
                  
                  {/* Signal Quality */}
                  {scanResults.averageSignalQuality && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('fastScan.metrics.averageSignalQuality')}:</span>
                      <span className="font-semibold">{(scanResults.averageSignalQuality * 100).toFixed(1)}{t('fastScan.units.percent')}</span>
                    </div>
                  )}
                  {scanResults.totalBadSignalSeconds && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('fastScan.metrics.badSignalDuration')}:</span>
                      <span className="font-semibold">{scanResults.totalBadSignalSeconds}{t('fastScan.units.seconds')}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 