import { useContext } from "react";
import { UsageDiv, Wrapper } from "../styles/Output.styled";
import { ThemeSpan, ThemesWrapper } from "../styles/Themes.styled";
import { themeFromArguments } from "../../utils/command";
import { termContext } from "../TerminalContext";
import theme from "../styles/themes";

const myThemes = Object.keys(theme);

const ThemeUsage = ({ marginY = false }: { marginY?: boolean }) => (
  <UsageDiv data-testid="themes-invalid-arg" marginY={marginY}>
    Usage: themes set &#60;theme-name&#62; <br />
    eg: themes set ubuntu
  </UsageDiv>
);

const Themes: React.FC = () => {
  const { arg } = useContext(termContext);

  return arg.length > 0 ? (
    themeFromArguments(arg) ? null : (
      <ThemeUsage />
    )
  ) : (
    <Wrapper data-testid="themes">
      <ThemesWrapper>
        {myThemes.map(myTheme => (
          <ThemeSpan key={myTheme}>{myTheme}</ThemeSpan>
        ))}
      </ThemesWrapper>
      <ThemeUsage marginY />
    </Wrapper>
  );
};

export default Themes;
