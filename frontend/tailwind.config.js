module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,html,mdx}"],
  darkMode: "class",
  screens: {
    sm: '640px',   
    md: '768px',    
    lg: '1024px',   
    xl: '1280px',
    '2xl': '1536px'
  },
  theme: {
    extend: {
      colors: {
        // Text Colors
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          light: "var(--text-light)",
          accent: "var(--text-accent)",
          success: "var(--text-success)",
          white: "var(--text-white)"
        },
        // Background Colors
        background: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          light: "var(--bg-light)",
          success: "var(--bg-success)",
          warning: "var(--bg-warning)",
          accent: "var(--bg-accent)",
          muted: "var(--bg-muted)",
          overlay: "var(--bg-overlay)",
          dark: "var(--bg-dark)",
          darker: "var(--bg-darker)",
          green: "var(--bg-green)"
        },
        // Border Colors
        border: {
          primary: "var(--border-primary)",
          accent: "var(--border-accent)",
          success: "var(--border-success)"
        },
        // Component-specific Colors
        header: {
          background: "var(--header-bg)",
          text: "var(--header-menu-text)",
          active: "var(--header-menu-active)"
        },
        search: {
          background: "var(--search-bg)",
          text: "var(--search-text)"
        },
        button: {
          text: "var(--button-text)"
        },
        line: {
          dark: "var(--line-dark)",
          light: "var(--line-light)"
        },
        progress: {
          background: "var(--progress-bg)"
        }
      },
      // Typography
      fontSize: {
        'xs': 'var(--font-size-xs)',
        'sm': 'var(--font-size-sm)',
        'base': 'var(--font-size-base)',
        'lg': 'var(--font-size-lg)'
      },
      fontWeight: {
        'normal': 'var(--font-weight-normal)',
        'medium': 'var(--font-weight-medium)'
      },
      lineHeight: {
        'tight': 'var(--line-height-tight)',
        'normal': 'var(--line-height-normal)',
        'relaxed': 'var(--line-height-relaxed)',
        'loose': 'var(--line-height-loose)'
      },
      fontFamily: {
        'roboto': ['Roboto', 'sans-serif'],
        'rubik': ['Rubik', 'sans-serif']
      },
      // Spacing
      spacing: {
        'xs': 'var(--spacing-xs)',
        'sm': 'var(--spacing-sm)',
        'md': 'var(--spacing-md)',
        'lg': 'var(--spacing-lg)',
        'xl': 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        '3xl': 'var(--spacing-3xl)',
        '4xl': 'var(--spacing-4xl)',
        '5xl': 'var(--spacing-5xl)',
        '6xl': 'var(--spacing-6xl)',
        '7xl': 'var(--spacing-7xl)',
        '8xl': 'var(--spacing-8xl)',
        '9xl': 'var(--spacing-9xl)',
        '10xl': 'var(--spacing-10xl)',
        '11xl': 'var(--spacing-11xl)',
        '12xl': 'var(--spacing-12xl)',
        '13xl': 'var(--spacing-13xl)',
        '14xl': 'var(--spacing-14xl)'
      },
      // Border Radius
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)'
      },
      // Border Width
      borderWidth: {
        'thick': 'var(--border-width-thick)'
      }
    }
  },
  plugins: []
};