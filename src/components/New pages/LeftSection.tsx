import React from "react";
import { motion } from "framer-motion";
import ProgressTracker from "../ProgressTracker";

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
  return (
    <motion.div 
      className="left-section w-full bg-white rounded-3xl p-2 sm:p-4 md:p-6 h-full container overflow-hidden flex flex-col"
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
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