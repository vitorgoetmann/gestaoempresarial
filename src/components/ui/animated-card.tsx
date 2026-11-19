// src/components/ui/animated-card.tsx
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper that adds a subtle entrance animation using Framer Motion.
 * Used throughout the dashboard to give a premium, lively feel.
 */
export const AnimatedCard = ({ children, className }: AnimatedCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 100, damping: 20 }}
    className={className}
  >
    {children}
  </motion.div>
);
