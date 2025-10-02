import React from 'react';
import { cva } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

const lineClasses = cva(
  'block',
  {
    variants: {
      orientation: {
        horizontal: 'w-full',
        vertical: 'h-full',
      },
      thickness: {
        thin: '',
        medium: '',
        thick: '',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
      thickness: 'thin',
    },
  }
);

const Line = ({
  // Dimensions from w*h format
  width,
  height,
  
  // Style props
  color = '#e5e7eb',
  className,
  
  // Optional layout props
  layout_width,
  position,
  
  ...props
}) => {
  // Safe validation for optional parameters
  const hasValidLayoutWidth = layout_width && typeof layout_width === 'string' && layout_width?.trim() !== '';
  const hasValidPosition = position && typeof position === 'string' && position?.trim() !== '';

  // Determine orientation based on dimensions
  let orientation = 'horizontal';
  let finalWidth = width;
  let finalHeight = height;

  // If w*h format is provided, parse it
  if (typeof width === 'string' && width?.includes('*')) {
    const [w, h] = width?.split('*')?.map(val => parseInt(val?.trim()));
    finalWidth = w;
    finalHeight = h;
    orientation = w > h ? 'horizontal' : 'vertical';
  } else if (width && height) {
    orientation = parseInt(width) > parseInt(height) ? 'horizontal' : 'vertical';
    finalWidth = parseInt(width);
    finalHeight = parseInt(height);
  }

  // Build optional Tailwind classes
  const optionalClasses = [
    hasValidLayoutWidth ? `w-[${layout_width}]` : '',
    hasValidPosition ? position : '',
  ]?.filter(Boolean)?.join(' ');

  // Build inline styles
  const lineStyles = {
    backgroundColor: color,
    width: finalWidth ? `${finalWidth}px` : orientation === 'horizontal' ? '100%' : '1px',
    height: finalHeight ? `${finalHeight}px` : orientation === 'vertical' ? '100%' : '1px',
  };

  // Determine thickness variant
  const thickness = finalHeight > 4 || finalWidth > 4 ? 'thick' : 
                   finalHeight > 2 || finalWidth > 2 ? 'medium' : 'thin';

  return (
    <div
      style={lineStyles}
      className={twMerge(
        lineClasses({ orientation, thickness }),
        optionalClasses,
        className
      )}
      role="separator"
      aria-orientation={orientation}
      {...props}
    />
  );
};

export default Line;