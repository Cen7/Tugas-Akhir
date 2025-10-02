import React from 'react';

const Logo = () => {
  return (
    <div className="flex items-center">
      <img 
        src="/images/img_header_logo.png" 
        alt="Restaurant Logo" 
        className="w-[46px] h-[46px] rounded-[22px] object-cover"
        style={{ borderRadius: '22px' }}
      />
    </div>
  );
};

export default Logo;