// Browsers can deny storage or run out of quota; these settings are optional.
export const setToLS = (key: string, value: string | null): boolean => {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export const getFromLS = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};
