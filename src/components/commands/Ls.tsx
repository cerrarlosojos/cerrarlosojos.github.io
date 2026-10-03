import { Fragment, useContext, useState } from "react";
import { displayDirectoryPath, resolveEntry } from "../../data/filesystem";
import { profile } from "../../data/profile";
import { formatTimestamp } from "../../utils/date";
import { getEntryMetadata } from "../../utils/fileMetadata";
import { termContext } from "../TerminalContext";
import { HelpPanel, PanelTitle } from "../styles/Help.styled";
import {
  DetailedListingPanel,
  DirectoryListing,
  FileLink,
  LongDirectoryListing,
} from "../styles/Ls.styled";
import { UsageDiv } from "../styles/Output.styled";

const listEntries = (args: string[], currentDirectory: string) => {
  let showHidden = false;
  let longFormat = false;
  let optionsEnded = false;
  const paths: string[] = [];
  const usage = "Usage: ls [-a] [-l] [path]";

  for (const arg of args) {
    if (!optionsEnded && arg === "--") {
      optionsEnded = true;
    } else if (!optionsEnded && arg.startsWith("-") && arg !== "-") {
      if (arg !== "-a" && arg !== "-l") return { error: usage };
      showHidden ||= arg === "-a";
      longFormat ||= arg === "-l";
    } else {
      paths.push(arg);
    }
  }
  if (paths.length > 1) return { error: usage };

  const resolved = resolveEntry(paths[0] ?? ".", currentDirectory);
  if (!resolved) {
    return {
      error: `ls: cannot access '${paths[0]}': No such file or directory`,
    };
  }
  const { entry, path } = resolved;
  const directory = entry.kind === "directory";
  const entries = directory
    ? entry.children.filter(({ name }) => showHidden || !name.startsWith("."))
    : [entry];

  return {
    longFormat,
    title: `${displayDirectoryPath(path)}${
      directory && path !== "/" ? "/" : ""
    }`,
    entries: entries.map(entry => ({
      entry,
      metadata: getEntryMetadata(entry),
    })),
  };
};

const Ls: React.FC = () => {
  const { arg, directory } = useContext(termContext);
  // An ls result is a snapshot; later runs must not rewrite earlier listings.
  const [listing] = useState(() => listEntries(arg, directory));

  if (listing.error !== undefined) {
    return <UsageDiv data-testid="ls-invalid-arg">{listing.error}</UsageDiv>;
  }

  const { entries, longFormat, title } = listing;
  const ListingPanel = longFormat ? DetailedListingPanel : HelpPanel;

  return (
    <ListingPanel data-testid="ls">
      <PanelTitle>{title}</PanelTitle>
      {longFormat ? (
        <LongDirectoryListing tabIndex={0}>
          <table aria-label="Detailed file listing">
            <thead className="sr-only">
              <tr>
                {[
                  "Permissions",
                  "Links",
                  "Owner",
                  "Group",
                  "Bytes",
                  "Modified",
                  "Name",
                ].map(heading => (
                  <th key={heading} scope="col">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map(({ entry, metadata }) => (
                <tr key={entry.name}>
                  <td>{metadata.permissions}</td>
                  <td className="numeric">{metadata.links}</td>
                  <td>{profile.username}</td>
                  <td>{profile.username}</td>
                  <td className="numeric">{metadata.size ?? "—"}</td>
                  <td>
                    {metadata.modifiedAt === null ? (
                      "—"
                    ) : (
                      <time
                        dateTime={new Date(metadata.modifiedAt).toISOString()}
                      >
                        {formatTimestamp(metadata.modifiedAt)}
                      </time>
                    )}
                  </td>
                  <td className="name">
                    {entry.kind === "file" && entry.url ? (
                      <FileLink
                        href={entry.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {entry.name}
                      </FileLink>
                    ) : (
                      `${entry.name}${entry.kind === "directory" ? "/" : ""}`
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </LongDirectoryListing>
      ) : (
        <DirectoryListing
          $files={entries.some(({ entry }) => entry.kind === "file")}
        >
          {entries.map(({ entry }) => (
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
      )}
    </ListingPanel>
  );
};

export default Ls;
