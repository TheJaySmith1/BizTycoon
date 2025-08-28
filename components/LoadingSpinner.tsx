
import React from 'react';

export const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center space-y-2">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
    <p className="text-brand-blue font-semibold">Contacting Advisors...</p>
  </div>
);
