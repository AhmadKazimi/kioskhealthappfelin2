import React from "react";

interface MiddleSectionProps {
  children?: React.ReactNode;
}

const MiddleSection: React.FC<MiddleSectionProps> = ({ children }) => {
  return (
    <>
      {children}
    </>
  );
};

export default MiddleSection;