import React from "react";

export const GlassInput = ({ 
  type = "text", 
  placeholder = "", 
  value, 
  onChange, 
  className = "", 
  isTextArea = false,
  rows = 4,
  ...props 
}) => {
  const commonClass = `glass-input w-full px-4 py-3 text-sm transition-all duration-200 text-gray-800 placeholder-gray-400/60 ${className}`;

  if (isTextArea) {
    return (
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        className={`${commonClass} resize-none`}
        placeholder={placeholder}
        {...props}
      />
    );
  }

  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      className={commonClass}
      placeholder={placeholder}
      {...props}
    />
  );
};
