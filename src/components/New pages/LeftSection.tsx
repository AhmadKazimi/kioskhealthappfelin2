import React from "react";
import { motion } from "framer-motion";
import ProgressTracker from "../ProgressTracker";
import { useTranslation } from "@/hooks/useTranslation";

interface LeftSectionProps {
  currentStep?: number;
  totalSteps?: number;
  onStepChange?: (step: number) => void;
  onNext?: () => void;
  onPrev?: () => void;
  showNavigationButtons?: boolean;
  children?: React.ReactNode;
}

const LeftSection: React.FC<LeftSectionProps> = ({ 
  currentStep = 1, 
  onStepChange, 
  onNext, 
  onPrev, 
  showNavigationButtons = false,
  children 
}) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  return (
    <motion.div 
      className={`left-section w-full bg-white rounded-2xl lg:rounded-3xl p-3 sm:p-4 md:p-6 h-full overflow-hidden flex flex-col ${isArabic ? 'rtl' : 'ltr'}`}
      initial={{ opacity: 0, x: isArabic ? 100 : -100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <motion.div
        className="w-full overflow-hidden flex-shrink-0"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <ProgressTracker
          initialStep={currentStep}
          onStepChange={onStepChange}
          onNext={onNext}
          onPrev={onPrev}
          showNavigationButtons={showNavigationButtons}
          className="w-full"
        />
      </motion.div>
      
      {children && (
        <motion.div
          className="w-full overflow-hidden flex-1 flex flex-col justify-center min-h-0"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
};

export default LeftSection;