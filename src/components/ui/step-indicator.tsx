// components/StepIndicators.tsx
import React from 'react';

interface StepIndicatorsProps {
  steps: string[];
  currentStep: number;
  onStepClick?: (index: number) => void;
}

const StepIndicators: React.FC<StepIndicatorsProps> = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="flex justify-center space-x-4 mb-8">
      {steps.map((step, index) => (
        <div
          key={index}
          onClick={() => onStepClick && onStepClick(index)}
          className={`flex flex-col items-center cursor-pointer ${onStepClick ? 'hover:opacity-80' : ''}`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
              index < currentStep ? 'bg-green-500' : index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            {index < currentStep ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              index + 1
            )}
          </div>
          <div className={`text-xs mt-2 ${ index === currentStep ? 'font-bold text-blue-600' : 'text-gray-600' }`} >
            {step}
          </div>
          {index < steps.length - 1 && (
            <div
              className={`absolute top-5 left-10 h-0.5 w-8 ${ index < currentStep - 1 ? 'bg-green-500' : 'bg-gray-300' }`}
              style={{ transform: 'translateX(50%)' }}
            ></div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StepIndicators;