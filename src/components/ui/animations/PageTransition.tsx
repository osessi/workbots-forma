"use client";

import { motion, AnimatePresence, HTMLMotionProps, Variants } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  className?: string;
  mode?: "fade" | "slide" | "scale";
}

const slideVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.3, ease: "easeIn" }
  }
};

const scaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.2, ease: "easeIn" }
  }
};

const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" }
  }
};

export function PageTransition({
  children,
  className,
  mode = "fade",
  ...props
}: PageTransitionProps) {
  const getVariants = (): Variants => {
    switch (mode) {
      case "slide":
        return slideVariants;
      case "scale":
        return scaleVariants;
      case "fade":
      default:
        return fadeVariants;
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={getVariants()}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Wrapper for page transitions with AnimatePresence
interface AnimatedPageProps {
  children: ReactNode;
  pageKey: string;
  mode?: "fade" | "slide" | "scale";
  className?: string;
}

export function AnimatedPage({ children, pageKey, mode = "fade", className }: AnimatedPageProps) {
  return (
    <AnimatePresence mode="wait">
      <PageTransition key={pageKey} mode={mode} className={className}>
        {children}
      </PageTransition>
    </AnimatePresence>
  );
}
