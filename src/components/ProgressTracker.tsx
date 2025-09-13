import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useTranslation } from "@/hooks/useTranslation";
import { useScreenWidth } from "@/hooks/useScreenWidth";

export interface Step {
  number: number;
  title: string;
  description: string;
}

interface ProgressTrackerProps {
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onNext?: () => void;
  onPrev?: () => void;
  showNavigationButtons?: boolean;
  className?: string;
  disabled?: boolean;
}

export interface ProgressTrackerRef {
  advanceStep: () => void;
  goBackStep: () => void;
  setStep: (step: number) => void;
}

const ProgressTracker = forwardRef<ProgressTrackerRef, ProgressTrackerProps>(({
  initialStep = 1,
  onStepChange,
  onNext,
  onPrev,
  showNavigationButtons = true,
  className = "",
  disabled = false
}, ref) => {
  const { t, i18n } = useTranslation();
  const [activeStep, setActiveStep] = useState(initialStep);
  const [isAnimating, setIsAnimating] = useState(false);
  const screenWidth = useScreenWidth();
  const phoneStyle = screenWidth < 1024; // Use mobile style for both mobile and tablet (< lg breakpoint)
  
  // RTL detection
  const isRTL = i18n?.language === 'ar' || (typeof document !== 'undefined' && document.documentElement.dir === 'rtl');

  // Update activeStep when initialStep prop changes
  useEffect(() => {
    setActiveStep(initialStep);
  }, [initialStep]);

  const steps: Step[] = [
    { 
      number: 1, 
      title: t('progress.personalInformation'), 
      description: t('progress.personalInformationDescription'),
    },
    { 
      number: 2, 
      title: t('progress.ageAndGender'), 
      description: t('progress.ageAndGenderDescription'),
    },
    { 
      number: 3, 
      title: t('progress.faceScan'), 
      description: t('progress.faceScanDescription'),
    },
    { 
      number: 4, 
      title: t('progress.scanCompleted'), 
      description: t('progress.scanCompletedDescription'),
    },
    { 
      number: 5, 
      title: t('progress.symptoms'), 
      description: t('progress.symptomsDescription'),
    }
  ];
  useImperativeHandle(ref, () => ({
    advanceStep: () => {
      if (activeStep < steps.length) {
        const newStep = activeStep + 1;
        setActiveStep(newStep);
        onStepChange?.(newStep);
        onNext?.();
      }
    },
    goBackStep: () => {
      if (activeStep > 1) {
        const newStep = activeStep - 1;
        setActiveStep(newStep);
        onStepChange?.(newStep);
        onPrev?.();
      }
    },
    setStep: (step: number) => {
      if (step >= 1 && step <= steps.length) {
        setActiveStep(step);
        onStepChange?.(step);
      }
    }
  }));

  const handleStepClick = (stepNumber: number) => {
    if (stepNumber !== activeStep && stepNumber >= 1 && stepNumber <= steps.length && !isAnimating) {
      // Store the previous step for direction logic
      const previousStep = activeStep;
      
      // Update step immediately for better visual feedback
      setActiveStep(stepNumber);
      onStepChange?.(stepNumber);
      
      setIsAnimating(true);
      
      // Reduced timeout for better responsiveness
      setTimeout(() => {
        setIsAnimating(false);
        // Call onNext or onPrev based on direction
        if (stepNumber > previousStep) {
          onNext?.();
        } else if (stepNumber < previousStep) {
          onPrev?.();
        }
      }, 150);
    }
  };

  const handleNext = () => {
    if (activeStep < steps.length && !isAnimating && !disabled) {
      setIsAnimating(true);
      
      setTimeout(() => {
        const newStep = activeStep + 1;
        setActiveStep(newStep);
        setIsAnimating(false);
        onStepChange?.(newStep);
        onNext?.();
      }, 300);
    }
  };

  const handlePrev = () => {
    if (activeStep > 1 && !isAnimating) {
      setIsAnimating(true);
      
      setTimeout(() => {
        const newStep = activeStep - 1;
        setActiveStep(newStep);
        setIsAnimating(false);
        onStepChange?.(newStep);
        onPrev?.();
      }, 300);
    }
  };



  return (
    <>
 {phoneStyle && (
    <div className={`flex flex-col items-center w-full justify-start ${className}`} style={{ overflow: 'visible', padding: '8px 0' }}>
      {/* Steps Container - Horizontal Layout */}
      <div className="flex flex-row mt-1 items-center justify-center w-full px-2" style={{ overflow: 'visible', gap: '8px' }}>
        {steps.map((step, index) => (
          <div 
            key={index} 
            className="flex flex-col items-center flex-shrink-0 relative" 
            style={{ 
              minWidth: '48px',
              padding: '8px',
              transition: 'all 0.3s ease-in-out'
            }}
          >
            {/* Step Number */}
            <div 
              className={`
                rounded-lg flex items-center justify-center font-semibold 
                transition-all duration-300 ease-in-out cursor-pointer relative z-10
                transform hover:scale-110
                ${
                  step.number === activeStep 
                  ? 'w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#004CE9] to-[#0040C0] text-white shadow-lg ring-4 ring-blue-200/50 scale-110' 
                  : step.number < activeStep 
                    ? 'w-6 h-6 sm:w-7 sm:h-7 bg-[#004CE9] text-white hover:bg-[#0040C0] shadow-sm'
                    : 'w-6 h-6 sm:w-7 sm:h-7 bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-600'
                }   
              `}
              onClick={() => handleStepClick(step.number)}
              style={{
                fontSize: step.number === activeStep ? '14px' : '12px'
              }}
            >
              <span className="font-semibold">{step.number}</span>
            </div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div 
                className="absolute h-0.5 transition-all duration-500 z-0"
                style={{ 
                  width: '30px',
                  [isRTL ? 'right' : 'left']: step.number === activeStep ? '32px' : '24px',
                  top: step.number === activeStep ? '20px' : '16px',
                  backgroundColor: step.number < activeStep ? '#004CE9' : '#E5E7EB',
                  transform: isRTL ? 'translateX(-10px)' : 'translateX(10px)'
                }}
              />
            )}
            
            {/* Step Title - Only show for active step on mobile */}
            <div className={`${isRTL ? 'text-right' : 'text-center'} mt-1 sm:mt-2 w-full absolute`} style={{ top: '100%' }}>
              <div className={`
                text-xs font-medium transition-all duration-300 leading-tight px-1
                ${step.number === activeStep 
                  ? 'text-blue-600 font-semibold opacity-100 transform translate-y-0' 
                  : screenWidth > 640 // Show text labels on sm and larger screens for better tablet experience
                    ? 'text-gray-400 opacity-70 transform translate-y-0' 
                    : 'opacity-0 transform -translate-y-2 pointer-events-none'
                }
              `}
              style={{
                whiteSpace: 'nowrap',
                minWidth: step.number === activeStep ? '80px' : 'auto',
                textAlign: isRTL ? 'right' : 'center'
              }}
              >
                {screenWidth > 640 || step.number === activeStep ? step.title : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
)}
    {!phoneStyle &&(
      <div className={` items-center w-full max-w-sm h-full justify-center ${className}`}>
      <div className="text-center ">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('progress.yourProgress')}</h2>
          <p className="text-gray-600">{t('progress.step')} {activeStep}</p>
        </div>
      <div className={`flex ${phoneStyle ? 'flex-row' : 'flex-col'} mt-1 items-start space-y-2 w-full h-full justify-start`}>
        
        {steps.map((step, index) => (
          <div key={index} className="flex items-start w-full gap-3">
            {/* Step Number */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div 
                className={`
                  w-8 h-8 rounded-md flex items-center justify-center text-xs font-semibold 
                  transition-colors duration-200 ease-in-out shadow-sm cursor-pointer
                  ${
                    step.number === activeStep 
                    ? 'mb-10 bg-gradient-to-br from-[#004CE9] via-[#004CE9]/80 to-white text-white border-2 border-[#004CE9]/30' 
                    : step.number > activeStep 
                    ? 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                    : 'bg-[#004CE9] text-white hover:bg-[#004CE9]/90'
                  }   
                `}
                onClick={() => handleStepClick(step.number)}
              >
                {step.number}
              </div>
              
              {/* Connector Line */}
              {!phoneStyle && index < steps.length - 1 && (
                <div className={`
                  w-0.5 h-8 mt-2 transition-all duration-300
                  ${step.number < activeStep
                    ? 'bg-blue-600' 
                    : 'bg-gray-200'
                  }
                `}></div>
              )}
            </div>
            
            {/* Step Content */}
            <div className="flex-1 pt-1 ml-3 w-full">
            {!phoneStyle && (  <div className={`
                text-sm font-semibold mb-1 transition-colors duration-300
                ${step.number === activeStep 
                  ? 'text-gray-900' 
                  : 'text-gray-400'
                }
              `}>
                {step.title}
              </div>
              )}
               {!phoneStyle || activeStep === index + 1 && (  <div className={`
                text-sm mb-1 transition-colors duration-300
                ${step.number === activeStep 
                  ? 'text-gray-900' 
                  : 'text-gray-400'
                }
              `}>
                {step.title}
              </div>
              )}
              {!phoneStyle && (
                <div className="flex flex-col items-start w-full">
                  <div className="text-xs transition-all duration-1000 ease-in-out leading-relaxed">
                    {step.description}
                  </div>
                </div>
              )}
             
              
              {/* Status Indicator */}
              {!phoneStyle && (
                <div className="flex items-center mt-1">
                <div className={`
                  w-1.5 h-1.5 rounded-full mr-1.5 transition-all duration-300
                    ${ step.number === activeStep ? 'bg-blue-600' : 'bg-gray-300'}
                `}></div>
                <span className={`
                  text-xs font-medium transition-colors duration-300
                  ${step.number === activeStep ? 'text-blue-600' : 'text-gray-400'}
                `}>
                      {step.number === activeStep ? t('progress.current') : step.number > activeStep ? t('progress.waiting') : t('progress.done')}
                </span>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Navigation Buttons */}
        {showNavigationButtons && (
          <div className="flex gap-2 mt-4 w-full">
            {onPrev && activeStep > 1 && (
              <button 
                onClick={handlePrev} 
                disabled={disabled}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('buttons.previous')}
              </button>
            )}
            {onNext && activeStep < steps.length && (
              <button 
                onClick={handleNext} 
                disabled={disabled}
                className="bg-gradient-to-br from-[#004CE9] via-[#004CE9]/80 to-white text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('buttons.next')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
    )}
    
    </>
  );
});

ProgressTracker.displayName = 'ProgressTracker';

export default ProgressTracker; 