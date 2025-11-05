import React from 'react';
import clsx from 'clsx'; // Import clsx (or similar library) for merging class names

// Accept props, including className
const Logo = ({ className }) => { 
  return (
    // The outer div might not be strictly necessary depending on your layout needs
    <div className="flex items-center justify-center"> 
      <img
        src="/images/img_header_logo.png"
        alt="Restaurant Logo"
        // Merge default classes with any className passed from the parent
        className={clsx(
          "object-cover", // Default: Ensure image scales nicely
          "rounded-full", // Default: Make it round
          "w-12 h-12", // Default size (example: 48px)
          className // Apply className from props *last* to override defaults
        )}
      />
    </div>
  );
};

export default Logo;