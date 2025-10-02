import React, { useState } from 'react';
import { cva } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

const searchClasses = cva(
  'flex items-center transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2',
  {
    variants: {
      size: {
        small: 'text-sm px-3 py-2',
        medium: 'text-base px-4 py-3',
        large: 'text-lg px-5 py-4',
      },
    },
    defaultVariants: {
      size: 'medium',
    },
  }
);

const SearchView = ({
  // Required parameters with defaults
  placeholder = "Search by menu name or tag",
  text_font_size = "16",
  text_font_family = "Roboto",
  text_font_weight = "400",
  text_line_height = "19px",
  text_text_align = "left",
  text_color = "#9ca3af",
  fill_background_color = "#f9fafb",
  border_border_radius = "8px",
  
  // Optional parameters (no defaults)
  layout_gap,
  layout_width,
  padding,
  margin,
  position,
  
  // Standard React props
  size,
  value,
  onChange,
  onSubmit,
  className,
  disabled = false,
  ...props
}) => {
  const [searchValue, setSearchValue] = useState(value || '');

  // Safe validation for optional parameters
  const hasValidGap = layout_gap && typeof layout_gap === 'string' && layout_gap?.trim() !== '';
  const hasValidWidth = layout_width && typeof layout_width === 'string' && layout_width?.trim() !== '';
  const hasValidPadding = padding && typeof padding === 'string' && padding?.trim() !== '';
  const hasValidMargin = margin && typeof margin === 'string' && margin?.trim() !== '';
  const hasValidPosition = position && typeof position === 'string' && position?.trim() !== '';

  // Build optional Tailwind classes
  const optionalClasses = [
    hasValidGap ? `gap-[${layout_gap}]` : '',
    hasValidWidth ? `w-[${layout_width}]` : 'w-full',
    hasValidPadding ? `p-[${padding}]` : '',
    hasValidMargin ? `m-[${margin}]` : '',
    hasValidPosition ? position : '',
  ]?.filter(Boolean)?.join(' ');

  // Build inline styles for required parameters
  const searchStyles = {
    fontSize: text_font_size ? `${text_font_size}px` : '16px',
    fontFamily: text_font_family || 'Roboto',
    fontWeight: text_font_weight || '400',
    lineHeight: text_line_height || '19px',
    textAlign: text_text_align || 'left',
    backgroundColor: fill_background_color || '#f9fafb',
    borderRadius: border_border_radius || '8px',
  };

  const inputStyles = {
    color: text_color || '#9ca3af',
    backgroundColor: 'transparent',
    outline: 'none',
    border: 'none',
    width: '100%',
  };

  const handleInputChange = (event) => {
    const newValue = event?.target?.value;
    setSearchValue(newValue);
    if (typeof onChange === 'function') {
      onChange(event);
    }
  };

  const handleSubmit = (event) => {
    event?.preventDefault();
    if (typeof onSubmit === 'function') {
      onSubmit(searchValue);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        style={searchStyles}
        className={twMerge(
          searchClasses({ size }),
          optionalClasses,
          className
        )}
      >
        <svg
          className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={handleInputChange}
          disabled={disabled}
          style={inputStyles}
          className="flex-1 bg-transparent outline-none"
          {...props}
        />
      </div>
    </form>
  );
};

export default SearchView;