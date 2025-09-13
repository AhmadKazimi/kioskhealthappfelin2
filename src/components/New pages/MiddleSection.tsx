import React from "react";

interface MiddleSectionProps {
  children?: React.ReactNode;
}

const MiddleSection: React.FC<MiddleSectionProps> = ({ children }) => {
  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {children}
      </div>
    </div>
  );
};

export default MiddleSection;