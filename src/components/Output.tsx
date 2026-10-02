import About from "./commands/About";
import FileReader from "./FileReader";
import Echo from "./commands/Echo";
import Education from "./commands/Education";
import GeneralOutput from "./commands/GeneralOutput";
import Help from "./commands/Help";
import Welcome from "./commands/Welcome";
import Ls from "./commands/Ls";
import Projects from "./commands/Projects";
import Socials from "./commands/Socials";
import Themes from "./commands/Themes";
import { CommandName, findCommand } from "../data/commands";
import { OutputContainer, UsageDiv } from "./styles/Output.styled";
import { termContext } from "./TerminalContext";
import { useContext } from "react";

type Props = {
  index: number;
  cmd: CommandName;
};

const Output: React.FC<Props> = ({ index, cmd }) => {
  const { arg, directory, commandError } = useContext(termContext);

  // return 'Usage: <cmd>' if command arg is not valid
  // eg: about tt
  if (!findCommand(cmd)?.acceptsArguments && arg.length > 0)
    return <UsageDiv data-testid="usage-output">Usage: {cmd}</UsageDiv>;

  return (
    <OutputContainer data-testid={index === 0 ? "latest-output" : null}>
      {
        {
          about: <About />,
          cat: <FileReader command="cat" />,
          cd: commandError ? (
            <UsageDiv data-testid="cd-invalid-arg">{commandError}</UsageDiv>
          ) : null,
          clear: null,
          echo: <Echo />,
          education: <Education />,
          glow: <FileReader command="glow" />,
          help: <Help />,
          ls: <Ls />,
          projects: <Projects />,
          pwd: <GeneralOutput>{directory}</GeneralOutput>,
          socials: <Socials />,
          themes: <Themes />,
          welcome: <Welcome />,
          whoami: <GeneralOutput>visitor</GeneralOutput>,
        }[cmd]
      }
    </OutputContainer>
  );
};

export default Output;
