"use client";

import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface DropdownAnimationProps {
  isOpen: boolean;
  children: ReactNode;
  className?: string;
  origin?: "top" | "top-left" | "top-right" | "bottom" | "bottom-left" | "bottom-right";
}

export function DropdownAnimation({
  isOpen,
  children,
  className,
  origin = "top"
}: DropdownAnimationProps) {
  const getTransformOrigin = () => {
    switch (origin) {
      case "top":
        return "top center";
      case "top-left":
        return "top left";
      case "top-right":
        return "top right";
      case "bottom":
        return "bottom center";
      case "bottom-left":
        return "bottom left";
      case "bottom-right":
        return "bottom right";
      default:
        return "top center";
    }
  };

  const getInitialY = () => {
    if (origin.startsWith("bottom")) return 10;
    return -10;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{
            opacity: 0,
            y: getInitialY(),
            scale: 0.95
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              duration: 0.2,
              ease: [0.25, 0.46, 0.45, 0.94]
            }
          }}
          exit={{
            opacity: 0,
            y: getInitialY() / 2,
            scale: 0.98,
            transition: { duration: 0.15, ease: "easeIn" }
          }}
          style={{ transformOrigin: getTransformOrigin() }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Dropdown item with hover animation
interface DropdownItemProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function DropdownItem({ children, className, onClick, ...props }: DropdownItemProps) {
  return (
    <motion.div
      whileHover={{
        backgroundColor: "rgba(0, 0, 0, 0.05)",
        transition: { duration: 0.15 }
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`cursor-pointer ${className || ""}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
