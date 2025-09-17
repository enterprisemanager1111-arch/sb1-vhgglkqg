/**
 * Input sanitization utilities to prevent XSS and validate user input
 */

export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/[<>\"'&]/g, (match) => {
      const escapeMap: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return escapeMap[match];
    })
    .trim()
    .substring(0, 255); // Limit length to prevent DoS
};

export const sanitizeText = (input: string, maxLength: number = 255): string => {
  return sanitizeInput(input).substring(0, maxLength);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = sanitizeInput(email);
  return emailRegex.test(sanitized) && sanitized.length <= 254; // RFC limit
};

export const validateName = (name: string): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(name);
  
  if (!sanitized) {
    return { isValid: false, error: 'Name ist erforderlich' };
  }
  
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Name muss mindestens 2 Zeichen lang sein' };
  }
  
  if (sanitized.length > 50) {
    return { isValid: false, error: 'Name darf maximal 50 Zeichen lang sein' };
  }
  
  return { isValid: true };
};

export const validateFamilyCode = (code: string): { isValid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeInput(code).toUpperCase();
  
  if (!sanitized) {
    return { isValid: false, sanitized, error: 'Familiencode ist erforderlich' };
  }
  
  if (sanitized.length !== 6) {
    return { isValid: false, sanitized, error: 'Familiencode muss genau 6 Zeichen lang sein' };
  }
  
  if (!/^[A-Z0-9]{6}$/.test(sanitized)) {
    return { isValid: false, sanitized, error: 'Familiencode darf nur Buchstaben und Zahlen enthalten' };
  }
  
  return { isValid: true, sanitized };
};