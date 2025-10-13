import React from 'react';
import { Card } from '@/components/ui/card';
import Counter from './Counter';

interface BloodPressureCardProps {
  title: string;
  icon: string;
  iconAlt?: string;
  systolicValue: number | null | undefined;
  diastolicValue: number | null | undefined;
  unit: string;
  isLoading: boolean;
  className?: string;
}

export default function BloodPressureCard({
  title,
  icon,
  iconAlt = "blood pressure icon",
  systolicValue,
  diastolicValue,
  unit,
  isLoading,
  className = ""
}: BloodPressureCardProps) {
  // Check if both values are valid
  const hasSystolicValue = systolicValue != null && systolicValue !== 0;
  const hasDiastolicValue = diastolicValue != null && diastolicValue !== 0;
  const hasValidValues = hasSystolicValue && hasDiastolicValue;

  return (
    <Card className={`bg-white flex flex-col p-3 sm:p-4 md:p-5 lg:p-6 rounded-2xl sm:rounded-3xl shadow-lg border-0 h-full min-h-[120px] sm:min-h-[140px] md:min-h-[160px] lg:min-h-[180px] ${className}`}>
      <p className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-[#4F8EFF] mb-auto">
        {title}
      </p>

      <div className="flex items-end justify-between gap-3 sm:gap-4 mt-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <img
            src={icon}
            alt={iconAlt}
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16"
          />
        </div>

        {/* Value and Unit */}
        <div className="flex flex-col items-end min-w-0">
          {isLoading ? (
            // Loading state: Show spinner
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-[#407EFF] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-500">{unit}</p>
            </div>
          ) : (
            <>
              {/* Blood Pressure Value: Systolic/Diastolic */}
              <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-black leading-tight whitespace-nowrap">
                {hasValidValues ? (
                  <>
                    <Counter
                      value={systolicValue}
                      duration={1500}
                      className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-black"
                    />
                    <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">/</span>
                    <Counter
                      value={diastolicValue}
                      duration={1500}
                      className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-black"
                    />
                  </>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </p>
              {/* Unit */}
              <p className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-700 mt-0.5">
                {unit}
              </p>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
