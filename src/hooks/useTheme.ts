import { useCallback, useState } from "react";
import themes from "../components/styles/themes";
import { setToLS, getFromLS } from "../utils/storage";
import { DefaultTheme } from "styled-components";

export const useTheme = () => {
  const [theme, setTheme] = useState<DefaultTheme>(() => {
    const name = getFromLS("tsn-theme");
    return name && Object.prototype.hasOwnProperty.call(themes, name)
      ? themes[name]
      : themes.dark;
  });

  const setMode = useCallback((mode: DefaultTheme) => {
    setToLS("tsn-theme", mode.name);
    setTheme(mode);
  }, []);

  return { theme, setMode };
};
