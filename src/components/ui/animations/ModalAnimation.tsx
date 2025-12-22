"use client";

import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface ModalAnimationProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
  backdropClassName?: string;
  closeOnBackdrop?: boolean;
}

export function ModalAnimation({
  isOpen,
  onClose,
  children,
  className,
  backdropClassName,
  closeOnBackdrop = true
}: ModalAnimationProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.2, delay: 0.1 } }}
            onClick={closeOnBackdrop ? onClose : undefined}
            className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm ${backdropClassName || ""}`}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: {
                duration: 0.3,
                ease: [0.25, 0.46, 0.45, 0.94]
              }
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 10,
              transition: { duration: 0.2, ease: "easeIn" }
            }}
            className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none ${className || ""}`}
          >
            <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Simple wrapper for modal content with animation
interface AnimatedModalContentProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  className?: string;
}

export function AnimatedModalContent({ children, className, ...props }: AnimatedModalContentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94]
        }
      }}
      exit={{
        opacity: 0,
        scale: 0.95,
        y: 10,
        transition: { duration: 0.2, ease: "easeIn" }
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
