// Language-specific styling utilities for proper script rendering

export const languageStyles = {
  // Tamil language styling
  ta: {
    fontFamily: "Noto Sans Tamil, Tamil Sangam MN, InaiMathi, Tamil MN, sans-serif",
    fontSize: "1.1rem",
    lineHeight: "1.6",
    direction: "ltr" as const,
    textAlign: "left" as const,
    letterSpacing: "0.02em"
  },
  
  // Sinhala language styling  
  si: {
    fontFamily: "Noto Sans Sinhala, Iskoola Pota, FM Malithi, sans-serif",
    fontSize: "1.1rem", 
    lineHeight: "1.7",
    direction: "ltr" as const,
    textAlign: "left" as const,
    letterSpacing: "0.01em"
  },
  
  // English language styling
  en: {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontSize: "1rem",
    lineHeight: "1.5", 
    direction: "ltr" as const,
    textAlign: "left" as const,
    letterSpacing: "0"
  },
  
  // Default fallback
  default: {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontSize: "1rem",
    lineHeight: "1.5",
    direction: "ltr" as const,
    textAlign: "left" as const,
    letterSpacing: "0"
  }
};

export const getLanguageStyle = (languageCode: string) => {
  return languageStyles[languageCode as keyof typeof languageStyles] || languageStyles.default;
};

export const getLanguageClassName = (languageCode: string) => {
  const baseClasses = "transition-all duration-200";
  
  switch (languageCode) {
    case 'ta':
      return `${baseClasses} font-tamil text-lg leading-relaxed`;
    case 'si': 
      return `${baseClasses} font-sinhala text-lg leading-loose`;
    case 'en':
      return `${baseClasses} font-sans text-base leading-normal`;
    default:
      return `${baseClasses} font-sans text-base leading-normal`;
  }
};

export const languageNames = {
  ta: "Tamil (தமிழ்)",
  si: "Sinhala (සිංහල)",
  en: "English",
  auto: "Auto-detect"
};

export const getLanguageName = (code: string) => {
  return languageNames[code as keyof typeof languageNames] || code.toUpperCase();
};
