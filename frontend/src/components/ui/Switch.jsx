// src/components/ui/Switch.jsx
import React, { useState, useEffect } from 'react';
import { cva } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

const switchClasses = cva(
  // DIUBAH: Warna ring fokus disesuaikan
  'relative inline-flex items-center cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#B28C63] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      size: {
        small: 'h-5 w-9',
        medium: 'h-6 w-11',
        large: 'h-7 w-14',
      },
    },
    defaultVariants: {
      size: 'medium',
    },
  }
);

const Switch = ({
  size,
  checked = false,
  onChange,
  disabled = false,
  className,
  id,
  name,
  ...props
}) => {
  const [isChecked, setIsChecked] = useState(checked);

  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  const handleToggle = () => {
    if (disabled) return;
    const newChecked = !isChecked;
    setIsChecked(newChecked);
    if (typeof onChange === 'function') {
      onChange(newChecked);
    }
  };

  // DIUBAH: Warna background saat aktif disesuaikan dengan gambar
  const switchBgClass = isChecked ? 'bg-[#B28C63]' : 'bg-gray-200';
  
  const thumbTranslateClass = isChecked
    ? size === 'small' ? 'translate-x-4' : size === 'large' ? 'translate-x-7' : 'translate-x-5'
    : 'translate-x-0';

  const thumbSizeClass = size === 'small' ? 'h-4 w-4'
    : size === 'large' ? 'h-6 w-6' : 'h-5 w-5';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      onClick={handleToggle}
      disabled={disabled}
      className={twMerge(
        switchClasses({ size }),
        switchBgClass,
        'rounded-full',
        className
      )}
      id={id}
      name={name}
      {...props}
    >
      <span
        className={twMerge(
          'inline-block bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out',
          thumbSizeClass,
          thumbTranslateClass
        )}
      />
    </button>
  );
};

export default Switch;