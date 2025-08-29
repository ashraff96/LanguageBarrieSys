// Theme configuration for the DocuTranslate application
export const theme = {
  // Color palette - Blue theme
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe', 
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554'
    },
    secondary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
      950: '#082f49'
    },
    accent: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
      950: '#022c22'
    }
  },

  // Gradient definitions
  gradients: {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    secondary: 'bg-gradient-to-r from-blue-50 to-indigo-50',
    accent: 'bg-gradient-to-r from-emerald-500 to-blue-500',
    page: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100',
    card: 'bg-gradient-to-br from-white to-blue-50',
    header: 'bg-gradient-to-r from-blue-600 to-indigo-700'
  },

  // Component styles
  components: {
    card: 'bg-white/80 backdrop-blur-sm border border-blue-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300',
    button: {
      primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300',
      secondary: 'bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 text-blue-800 border border-blue-300 shadow-md hover:shadow-lg transition-all duration-300',
      outline: 'border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-800 transition-all duration-300'
    },
    input: 'border-blue-200 focus:border-blue-400 focus:ring-blue-400 focus:ring-opacity-50 transition-all duration-200',
    select: 'border-blue-200 focus:border-blue-400 focus:ring-blue-400 focus:ring-opacity-50 transition-all duration-200'
  },

  // Layout styles
  layout: {
    page: 'min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100',
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    header: 'bg-white/95 backdrop-blur-sm border-b border-blue-200 shadow-sm',
    sidebar: 'bg-white/90 backdrop-blur-sm border-r border-blue-200 shadow-lg'
  },

  // Animation and effects
  effects: {
    glow: 'shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40',
    blur: 'backdrop-blur-sm',
    transition: 'transition-all duration-300 ease-in-out',
    hover: 'hover:scale-105 hover:shadow-xl',
    focus: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
  },

  // Typography
  typography: {
    heading: 'font-bold text-blue-900',
    subheading: 'font-semibold text-blue-800',
    body: 'text-gray-700',
    muted: 'text-blue-600',
    accent: 'text-emerald-600'
  }
};

// Helper functions for dynamic theme application
export const getThemeClass = (category: string, variant: string = 'default') => {
  const categories = theme as any;
  return categories[category]?.[variant] || '';
};

export const applyTheme = (element: string, variant: string = 'primary') => {
  return `${theme.components[element as keyof typeof theme.components]} ${theme.effects.transition}`;
};

export default theme;
