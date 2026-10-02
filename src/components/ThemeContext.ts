import { createContext } from "react";
import { DefaultTheme } from "styled-components";

export const themeContext = createContext<
  ((switchTheme: DefaultTheme) => void) | null
>(null);
