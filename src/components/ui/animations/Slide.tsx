"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface SlideProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: "left" | "right" | "up" | "down";
  distance?: number;
  className?: string;
}

export function SlideIn({
  children,
  delay = 0,
  duration = 0.4,
  direction = "left",
  distance = 30,
  className,
  ...props
}: SlideProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case "left":
        return { x: -distance, y: 0 };
      case "right":
        return { x: distance, y: 0 };
      case "up":
        return { x: 0, y: distance };
      case "down":
        return { x: 0, y: -distance };
    }
  };

  const initial = getInitialPosition();

  return (
    <motion.div
      initial={{ opacity: 0, ...initial }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
        transition: { duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }
      }}
      exit={{
        opacity: 0,
        transition: { duration: 0.2 }
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface SlideFromSideProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function SlideInFromLeft({ children, delay = 0, duration = 0.4, className, ...props }: SlideFromSideProps) {
  return (
    <SlideIn direction="left" delay={delay} duration={duration} className={className} {...props}>
      {children}
    </SlideIn>
  );
}

export function SlideInFromRight({ children, delay = 0, duration = 0.4, className, ...props }: SlideFromSideProps) {
  return (
    <SlideIn direction="right" delay={delay} duration={duration} className={className} {...props}>
      {children}
    </SlideIn>
  );
}
