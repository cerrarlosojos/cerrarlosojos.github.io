import { useContext } from "react";
import { Wrapper } from "../styles/Output.styled";
import { termContext } from "../TerminalContext";

const Echo: React.FC = () => {
  const { arg } = useContext(termContext);

  const outputStr = arg.join(" ").replace(/^(['"`])(.*)\1$/, "$2");

  return <Wrapper>{outputStr}</Wrapper>;
};

export default Echo;
