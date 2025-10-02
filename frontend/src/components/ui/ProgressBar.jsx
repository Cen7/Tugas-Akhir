import React from 'react';
import { cva } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

const progressBarClasses = cva(
  'relative overflow-hidden transition-all duration-300',
  {
    variants: {
      size: {
        small: 'h-2',
        medium: 'h-3',
        large: 'h-4',
      },
    },
    defaultVariants: {
      size: 'medium',
    },
  }
);

const ProgressBar = ({
  // Required parameters with defaults
  fill_background_color = "#cda1721e",
  border_border_radius = "4px",
  
  // Optional parameters (no defaults)
  layout_width,
  position,
  
  // Standard React props
  value = 0,
  max = 100,
  size,
  className,
  progressColor = "#cda172",
  showLabel = false,
  ...props
}) => {
  // Safe validation for optional parameters
  const hasValidWidth = layout_width && typeof layout_width === 'string' && layout_width?.trim() !== '';
  const hasValidPosition = position && typeof position === 'string' && position?.trim() !== '';

  // Build optional Tailwind classes
  const optionalClasses = [
    hasValidWidth ? `w-[${layout_width}]` : 'w-full',
    hasValidPosition ? position : '',
  ]?.filter(Boolean)?.join(' ');

  // Calculate progress percentage
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  // Build inline styles for required parameters
  const containerStyles = {
    backgroundColor: fill_background_color || '#cda1721e',
    borderRadius: border_border_radius || '4px',
  };

  const progressStyles = {
    width: `${percentage}%`,
    backgroundColor: progressColor,
    borderRadius: border_border_radius || '4px',
    transition: 'width 0.3s ease-in-out',
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        style={containerStyles}
        className={twMerge(
          progressBarClasses({ size }),
          optionalClasses,
          className
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`Progress: ${Math.round(percentage)}%`}
        {...props}
      >
        <div
          style={progressStyles}
          className="h-full transition-all duration-300 ease-in-out"
        />
      </div>
    </div>
  );
};

export default ProgressBar;