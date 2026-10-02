import { useEffect } from "react";
import { ThemeProvider } from "styled-components";
import { useTheme } from "./hooks/useTheme";
import GlobalStyle from "./components/styles/GlobalStyle";
import Terminal from "./components/Terminal";
import { profile } from "./data/profile";
import { themeContext } from "./components/ThemeContext";

function App() {
  const { theme, setMode } = useTheme();

  // Update the browser theme color when switching themes
  useEffect(() => {
    const themeColor = theme.colors?.body;

    const metaThemeColor = document.querySelector("meta[name='theme-color']");
    metaThemeColor?.setAttribute("content", themeColor);
  }, [theme]);

  return (
    <>
      <h1 className="sr-only">
        {profile.name} ({profile.chineseName})
      </h1>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <themeContext.Provider value={setMode}>
          <Terminal />
        </themeContext.Provider>
      </ThemeProvider>
    </>
  );
}

export default App;
