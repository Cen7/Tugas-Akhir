import React from 'react';

const HeaderMenuItem = ({ text, href, active = false, onClick }) => {
  const handleClick = (event) => {
    if (typeof onClick === 'function') {
      onClick(event);
    }
  };

  const textColor = active ? '#cda172' : '#3c4349';
  const fontWeight = active ? '500' : '400';

  return (
    <a
      href={href}
      onClick={handleClick}
      className="block py-2 lg:py-0 transition-colors duration-200 hover:opacity-80"
      role="menuitem"
      style={{
        fontSize: '20px',
        fontFamily: 'Rubik',
        fontWeight: fontWeight,
        lineHeight: '24px',
        textAlign: 'left',
        color: textColor,
        textDecoration: 'none',
      }}
    >
      {text}
    </a>
  );
};

export default HeaderMenuItem;