import { Fragment, useContext } from "react";
import {
  displayDirectoryPath,
  listDirectory,
  resolveDirectoryPath,
} from "../../data/filesystem";
import { termContext } from "../TerminalContext";
import { HelpPanel, PanelTitle } from "../styles/Help.styled";
import { DirectoryListing, FileLink } from "../styles/Ls.styled";
import { UsageDiv } from "../styles/Output.styled";

const Ls: React.FC = () => {
  const { arg, directory: currentDirectory } = useContext(termContext);
  const args = arg;
  const showHidden = args.includes("-a");
  const paths = args.filter(argument => argument !== "-a");

  if (paths.length > 1 || paths.some(path => path.startsWith("-"))) {
    return (
      <UsageDiv data-testid="ls-invalid-arg">
        Usage: ls [-a] [directory]
      </UsageDiv>
    );
  }

  const path = resolveDirectoryPath(paths[0] ?? ".", currentDirectory);
  if (path === null) {
    return (
      <UsageDiv data-testid="ls-invalid-arg">
        ls: cannot access '{paths[0]}': No such directory
      </UsageDiv>
    );
  }
  const entries = listDirectory(path).filter(
    ({ name }) => showHidden || !name.startsWith(".")
  );

  return (
    <HelpPanel data-testid="ls">
      <PanelTitle>{`${displayDirectoryPath(path)}${
        path === "/" ? "" : "/"
      }`}</PanelTitle>
      <DirectoryListing $files={entries.some(entry => entry.kind === "file")}>
        {entries.map(entry => (
          <Fragment key={entry.name}>
            <dt>
              {entry.kind === "file" && entry.url ? (
                <FileLink href={entry.url} target="_blank" rel="noreferrer">
                  {entry.name}
                </FileLink>
              ) : (
                `${entry.name}${entry.kind === "directory" ? "/" : ""}`
              )}
            </dt>
            <dd>{entry.description}</dd>
          </Fragment>
        ))}
      </DirectoryListing>
    </HelpPanel>
  );
};

export default Ls;
