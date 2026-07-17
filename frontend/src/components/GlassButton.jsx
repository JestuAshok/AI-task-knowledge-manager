import React from "react";
import { motion } from "framer-motion";

export const GlassButton = ({ 
  children, 
  className = "", 
  variant = "primary", 
  disabled = false,
  type = "button",
  ...props 
}) => {
  const baseStyle = "px-6 py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-sm relative overflow-hidden select-none border";
  
  const variants = {
    primary: "bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-500 hover:to-indigo-550 text-white border-transparent shadow-purple-500/10",
    secondary: "bg-white/40 border-white/50 text-gray-800 hover:bg-white/60 hover:border-white/60 shadow-gray-200/20",
    danger: "bg-red-500/10 border-red-500/20 text-red-650 hover:bg-red-500/20 hover:border-red-500/30",
    success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-650 hover:bg-emerald-500/20 hover:border-emerald-500/30"
  };

  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      className={`${baseStyle} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};
