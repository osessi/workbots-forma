"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";
import { fadeVariants, fadeUpVariants, fadeDownVariants, slideVariants } from "./variants";

interface FadeInProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, duration = 0.3, className, ...props }: FadeInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { duration, delay, ease: "easeOut" }
        },
        exit: { opacity: 0, transition: { duration: 0.2 } }
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadeInUp({ children, delay = 0, duration = 0.4, className, ...props }: FadeInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }
        },
        exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadeInDown({ children, delay = 0, duration = 0.4, className, ...props }: FadeInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={{
        hidden: { opacity: 0, y: -20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }
        },
        exit: { opacity: 0, y: 10, transition: { duration: 0.2 } }
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadeInLeft({ children, delay = 0, duration = 0.4, className, ...props }: FadeInProps) {
  return (
    <motion.div
      initial="hiddenLeft"
      animate="visible"
      exit="exit"
      variants={{
        hiddenLeft: { opacity: 0, x: -30 },
        visible: {
          opacity: 1,
          x: 0,
          transition: { duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }
        },
        exit: { opacity: 0, transition: { duration: 0.2 } }
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadeInRight({ children, delay = 0, duration = 0.4, className, ...props }: FadeInProps) {
  return (
    <motion.div
      initial="hiddenRight"
      animate="visible"
      exit="exit"
      variants={{
        hiddenRight: { opacity: 0, x: 30 },
        visible: {
          opacity: 1,
          x: 0,
          transition: { duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }
        },
        exit: { opacity: 0, transition: { duration: 0.2 } }
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
