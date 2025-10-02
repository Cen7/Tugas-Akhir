import React from 'react';
import { twMerge } from 'tailwind-merge';

const Grid = ({ 
  children, 
  columns = 1, 
  gap = 4, 
  className,
  responsive = true,
  ...props 
}) => {
  // Build responsive grid classes
  const getGridCols = () => {
    if (!responsive) {
      return `grid-cols-${columns}`;
    }
    
    // Responsive grid: 1 col on mobile, scale up on larger screens
    const baseClass = 'grid-cols-1';
    const smClass = columns >= 2 ? 'sm:grid-cols-2' : '';
    const mdClass = columns >= 3 ? 'md:grid-cols-3' : columns >= 2 ? 'md:grid-cols-2' : '';
    const lgClass = columns >= 4 ? `lg:grid-cols-${Math.min(columns, 4)}` : columns >= 3 ? 'lg:grid-cols-3' : columns >= 2 ? 'lg:grid-cols-2' : '';
    const xlClass = columns > 4 ? `xl:grid-cols-${columns}` : '';
    
    return [baseClass, smClass, mdClass, lgClass, xlClass]?.filter(Boolean)?.join(' ');
  };

  const gridClasses = twMerge(
    'grid',
    getGridCols(),
    `gap-${gap}`,
    className
  );

  return (
    <div className={gridClasses} {...props}>
      {children}
    </div>
  );
};

export default Grid;