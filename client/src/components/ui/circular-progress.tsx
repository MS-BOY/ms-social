import React from "react";
import { cn } from "@/lib/utils";

type CircularProgressProps = {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  bgColor?: string;
  progressColor?: string;
  showPercentage?: boolean;
  textClassName?: string;
};

export function CircularProgress({
  value,
  size = 40,
  strokeWidth = 4,
  className,
  bgColor = "rgba(255, 255, 255, 0.2)",
  progressColor = "rgb(70, 130, 246)",
  showPercentage = true,
  textClassName
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {showPercentage && (
        <div 
          className={cn(
            "absolute inset-0 flex items-center justify-center text-xs font-semibold",
            textClassName
          )}
        >
          {Math.round(value)}%
        </div>
      )}
    </div>
  );
}