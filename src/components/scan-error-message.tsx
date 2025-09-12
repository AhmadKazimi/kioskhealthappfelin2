import React from 'react';

type ErrorMessageProps = {
  message: string;
};

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div style={{ color: 'red', padding: '10px' }}>
      Error: {message}
    </div>
  );
};

export default ErrorMessage;