import { lazy, Suspense, useContext } from "react";
import { displayDirectoryPath, resolveEntry } from "../data/filesystem";
import { termContext } from "./TerminalContext";
import { HelpPanel, PanelTitle } from "./styles/Help.styled";
import { FileContent } from "./styles/Cat.styled";
import { FileLink } from "./styles/Ls.styled";
import { UsageDiv } from "./styles/Output.styled";

const MarkdownPreview = lazy(() => import("./MarkdownPreview"));
const EncryptedMemory = lazy(() => import("./EncryptedMemory"));

const FileReader: React.FC<{ command: "cat" | "glow" }> = ({ command }) => {
  const {
    arg: paths,
    directory: currentDirectory,
    isCurrent,
  } = useContext(termContext);

  if (paths.length === 0) {
    return (
      <UsageDiv data-testid={`${command}-invalid-arg`}>
        Usage: {command} &lt;{command === "glow" ? "file.md" : "file"}&gt; [file
        ...]
      </UsageDiv>
    );
  }

  return (
    <div data-testid={command}>
      {paths.map((path, index) => {
        const resolved = resolveEntry(path, currentDirectory);
        if (!resolved || resolved.entry.kind === "directory") {
          return (
            <UsageDiv
              key={`${path}-${index}`}
              data-testid={`${command}-invalid-arg`}
            >
              {command}: {path}:{" "}
              {resolved ? "Is a directory" : "No such file or directory"}
            </UsageDiv>
          );
        }

        const { entry: file, path: absolutePath } = resolved;
        const displayPath = displayDirectoryPath(absolutePath);
        if (command === "glow" && !file.name.endsWith(".md")) {
          return (
            <UsageDiv key={`${path}-${index}`} data-testid="glow-invalid-arg">
              glow: {path}: Not a Markdown file
            </UsageDiv>
          );
        }
        if (file.encrypted === "memory") {
          return (
            <Suspense
              key={`${path}-${index}`}
              fallback={<FileContent>Loading…</FileContent>}
            >
              <EncryptedMemory
                path={displayPath}
                autoFocus={isCurrent && index === 0}
              />
            </Suspense>
          );
        }
        return (
          <HelpPanel key={`${path}-${index}`}>
            <PanelTitle>{displayPath}</PanelTitle>
            {command === "glow" ? (
              <Suspense fallback={<FileContent>Loading…</FileContent>}>
                <MarkdownPreview content={file.content} />
              </Suspense>
            ) : (
              <FileContent>
                {file.content}
                {file.url && (
                  <>
                    {"\n\n"}
                    <FileLink href={file.url} target="_blank" rel="noreferrer">
                      {file.url}
                    </FileLink>
                  </>
                )}
              </FileContent>
            )}
          </HelpPanel>
        );
      })}
    </div>
  );
};

export default FileReader;
