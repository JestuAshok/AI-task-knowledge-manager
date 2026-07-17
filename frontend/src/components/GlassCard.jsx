import React from "react";
import { motion } from "framer-motion";

export const GlassCard = ({ 
  children, 
  className = "", 
  hoverEffect = true,
  delay = 0,
  ...props 
}) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 100, 
        damping: 15,
        delay: delay 
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      whileHover={hoverEffect ? { 
        y: -4, 
        scale: 1.01,
        boxShadow: "0 12px 40px rgba(139, 92, 246, 0.08)",
        borderColor: "rgba(139, 92, 246, 0.25)" 
      } : undefined}
      className={`glass-card rounded-3xl p-6 border border-white/40 shadow-sm relative overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
