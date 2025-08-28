
import React from 'react';

interface ActionButtonProps {
  action: string;
  onClick: (action: string) => void;
  disabled: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ action, onClick, disabled }) => {
  return (
    <button
      onClick={() => onClick(action)}
      disabled={disabled}
      className="w-full text-left p-3 bg-dark-tertiary border border-border-color rounded-lg hover:bg-brand-blue/20 hover:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed group"
    >
      <span className="text-gray-300 group-hover:text-brand-blue transition-colors duration-200">{action}</span>
    </button>
  );
};
