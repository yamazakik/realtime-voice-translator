
import React from 'react';

interface TextAreaDisplayProps {
  label: string;
  text: string;
  placeholder?: string;
  className?: string;
  dynamicStyle?: React.CSSProperties; 
}

export const TextAreaDisplay: React.FC<TextAreaDisplayProps> = ({
  label,
  text,
  placeholder = "テキストがここに表示されます...",
  className = "",
  dynamicStyle 
}) => {
  const containerClasses = `w-full p-3 bg-slate-800 border border-slate-700 rounded-lg shadow-sm overflow-y-auto text-slate-200 whitespace-pre-wrap focus:ring-indigo-500 focus:border-indigo-500 selection:bg-indigo-500 selection:text-white`;

  const labelStyle: React.CSSProperties = {};
  if (dynamicStyle?.fontSize) {
    // Ensure fontSize is treated as a number for calculation
    const currentFontSize = typeof dynamicStyle.fontSize === 'string' ? parseFloat(dynamicStyle.fontSize) : dynamicStyle.fontSize || 16;
    labelStyle.fontSize = `${Math.max(13, Math.round(currentFontSize * 0.85))}px`;
  }


  return (
    <div className={`w-full ${className}`}>
      <label 
        className="block text-sm font-medium text-slate-300 mb-1" 
        style={labelStyle}
      >
        {label}
      </label>
      <div 
        className={containerClasses}
        style={dynamicStyle}
        aria-label={`${label} Text Area`}
      >
        {text || <span className="text-slate-500" style={dynamicStyle ? {fontSize: dynamicStyle.fontSize} : {}}>{placeholder}</span>}
      </div>
    </div>
  );
};
