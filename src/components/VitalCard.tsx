import React from 'react';
import { Card } from '@/components/ui/card';
import Counter from './Counter';

interface VitalCardProps {
  title: string;
  icon: string;
  iconAlt?: string;
  value: number | null | undefined;
  unit: string;
  isLoading: boolean;
  className?: string;
  decimals?: number;
}

export default function VitalCard({
  title,
  icon,
  iconAlt = "vital icon",
  value,
  unit,
  isLoading,
  className = "",
  decimals = 0
}: VitalCardProps) {
  // Check if value is valid (not null, undefined, or 0)
  const hasValidValue = value != null && value !== 0;

  return (
    <Card className={`bg-white flex flex-col p-2 xs:p-2.5 sm:p-4 md:p-5 lg:p-6 rounded-xl sm:rounded-2xl md:rounded-3xl shadow-md sm:shadow-lg border-0 h-full min-h-[100px] xs:min-h-[110px] sm:min-h-[140px] md:min-h-[160px] lg:min-h-[180px] ${className}`}>
      <p className="text-xs xs:text-xs sm:text-base md:text-lg lg:text-xl font-semibold text-[#4F8EFF] mb-auto line-clamp-2 leading-tight">
        {title}
      </p>

      <div className="flex items-end justify-between gap-1.5 xs:gap-2 sm:gap-4 mt-2 sm:mt-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <img
            src={icon}
            alt={iconAlt}
            className="w-7 h-7 xs:w-8 xs:h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 object-contain"
          />
        </div>

        {/* Value and Unit */}
        <div className="flex flex-col items-end min-w-0 flex-1 overflow-hidden">
          {isLoading ? (
            // Loading state: Show spinner
            <div className="flex items-center space-x-1 xs:space-x-1.5 sm:space-x-2">
              <div className="w-4 h-4 xs:w-5 xs:h-5 sm:w-8 sm:h-8 border-2 border-[#407EFF] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-500 truncate">{unit}</p>
            </div>
          ) : (
            <>
              {/* Value: Show counter if valid, otherwise show "-" */}
              <p className="text-lg xs:text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-black leading-tight truncate max-w-full">
                {hasValidValue ? (
                  <Counter
                    value={value}
                    duration={1500}
                    decimals={decimals}
                    className="text-lg xs:text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-black"
                  />
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </p>
              {/* Unit */}
              <p className="text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-700 mt-0.5 truncate max-w-full">
                {unit}
              </p>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
