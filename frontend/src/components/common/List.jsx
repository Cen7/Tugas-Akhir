import React from 'react';
import { twMerge } from 'tailwind-merge';

const List = ({ 
  children, 
  direction = 'vertical',
  gap = 4,
  className,
  ordered = false,
  ...props 
}) => {
  const ListComponent = ordered ? 'ol' : 'ul';
  
  const listClasses = twMerge(
    'flex',
    direction === 'horizontal' ? 'flex-row' : 'flex-col',
    `gap-${gap}`,
    'list-none',
    className
  );

  return (
    <ListComponent className={listClasses} {...props}>
      {React.Children?.map(children, (child, index) => (
        <li key={index} className="flex-shrink-0">
          {child}
        </li>
      ))}
    </ListComponent>
  );
};

export default List;