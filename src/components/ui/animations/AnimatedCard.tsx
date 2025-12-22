"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  className?: string;
  hoverScale?: number;
  hoverShadow?: boolean;
  delay?: number;
}

export function AnimatedCard({
  children,
  className,
  hoverScale = 1.02,
  hoverShadow = true,
  delay = 0,
  ...props
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.4,
          delay,
          ease: [0.25, 0.46, 0.45, 0.94]
        }
      }}
      whileHover={{
        scale: hoverScale,
        boxShadow: hoverShadow
          ? "0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
          : undefined,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
