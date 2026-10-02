import { User, WebsiteName, Wrapper } from "./styles/TerminalInfo.styled";
import { profile } from "../data/profile";
import { displayDirectoryPath, homeDirectory } from "../data/filesystem";

const TermInfo = ({ directory = homeDirectory }: { directory?: string }) => {
  return (
    <Wrapper>
      <User>visitor</User>@<WebsiteName>{profile.username}</WebsiteName>:
      {displayDirectoryPath(directory)}$
    </Wrapper>
  );
};

export default TermInfo;
