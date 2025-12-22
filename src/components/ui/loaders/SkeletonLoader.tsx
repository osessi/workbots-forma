"use client";

import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
  style?: React.CSSProperties;
}

// Base Skeleton component with shimmer animation
export function Skeleton({ className, rounded = "md", style }: SkeletonProps) {
  const roundedClasses = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full"
  };

  return (
    <div
      className={`
        relative overflow-hidden bg-gray-200 dark:bg-gray-700
        ${roundedClasses[rounded]}
        ${className || ""}
      `}
      style={style}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent"
        animate={{ translateX: ["100%", "-100%"] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
}

// Skeleton pour un texte (ligne)
interface SkeletonTextProps {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}

export function SkeletonText({ lines = 3, className, lastLineWidth = "60%" }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className || ""}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-4"
          style={{
            width: index === lines - 1 ? lastLineWidth : "100%"
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// Skeleton pour un avatar
interface SkeletonAvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function SkeletonAvatar({ size = "md", className }: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  return <Skeleton className={`${sizeClasses[size]} ${className || ""}`} rounded="full" />;
}

// Skeleton pour une carte
interface SkeletonCardProps {
  hasImage?: boolean;
  hasAvatar?: boolean;
  lines?: number;
  className?: string;
}

export function SkeletonCard({ hasImage = true, hasAvatar = false, lines = 2, className }: SkeletonCardProps) {
  return (
    <div className={`p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${className || ""}`}>
      {hasImage && (
        <Skeleton className="w-full h-40 mb-4" rounded="lg" />
      )}
      <div className="flex items-start gap-3">
        {hasAvatar && <SkeletonAvatar />}
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <SkeletonText lines={lines} lastLineWidth="50%" />
        </div>
      </div>
    </div>
  );
}

// Skeleton pour une liste
interface SkeletonListProps {
  items?: number;
  hasAvatar?: boolean;
  className?: string;
}

export function SkeletonList({ items = 5, hasAvatar = true, className }: SkeletonListProps) {
  return (
    <div className={`space-y-4 ${className || ""}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-3 rounded-lg">
          {hasAvatar && <SkeletonAvatar />}
          <div className="flex-1">
            <Skeleton className="h-4 w-1/3 mb-2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-8 w-20" rounded="lg" />
        </div>
      ))}
    </div>
  );
}

// Skeleton pour un tableau
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, columns = 4, className }: SkeletonTableProps) {
  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className || ""}`}>
      {/* Header */}
      <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Skeleton pour les stats/KPIs
interface SkeletonStatsProps {
  count?: number;
  className?: string;
}

export function SkeletonStats({ count = 4, className }: SkeletonStatsProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className || ""}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-8 w-3/4 mb-1" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

// Skeleton pour une formation
export function SkeletonFormation({ className }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden ${className || ""}`}>
      <Skeleton className="w-full h-48" rounded="sm" />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-6 w-20" rounded="full" />
          <Skeleton className="h-6 w-16" rounded="full" />
        </div>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <SkeletonText lines={2} lastLineWidth="70%" />
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <SkeletonAvatar size="sm" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-24" rounded="lg" />
        </div>
      </div>
    </div>
  );
}

// Skeleton pour le stepper
export function SkeletonStepper({ steps = 5, className }: { steps?: number; className?: string }) {
  return (
    <div className={`flex items-center justify-between ${className || ""}`}>
      {Array.from({ length: steps }).map((_, index) => (
        <div key={index} className="flex items-center">
          <div className="flex flex-col items-center">
            <Skeleton className="w-10 h-10" rounded="full" />
            <Skeleton className="h-3 w-16 mt-2" />
          </div>
          {index < steps - 1 && (
            <Skeleton className="h-0.5 w-16 mx-2" />
          )}
        </div>
      ))}
    </div>
  );
}
