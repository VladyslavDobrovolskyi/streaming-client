export const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  return emailRegex.test(email);
};

export const validatePasswordLength = (password) => {
  return password.length >= 8;
};

export const validatePasswordMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

export const validateName = (name) => {
  return !/\d/.test(name);
};

export const sanitizeInput = (input) => {
  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

export const validateSearchQuery = (query) => {
  if (query.trim().length < 3) {
    return 'Запрос должен содержать минимум 3 символа.';
  }
  if (/[^a-zA-Z0-9 ]/g.test(query)) {
    return 'Запрос не может содержать специальных символов.';
  }
  return '';
};