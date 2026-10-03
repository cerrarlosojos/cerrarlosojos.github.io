import React, {
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Output from "./Output";
import TermInfo from "./TermInfo";
import DinoGame from "./DinoGame";
import type { DinoRun } from "../games/createDinoRunner";
import { formatTimestamp } from "../utils/date";
import { GameHint } from "./styles/DinoGame.styled";
import {
  CmdNotFound,
  Empty,
  Form,
  Hints,
  Input,
  MobileBr,
  MobileSpan,
  Wrapper,
} from "./styles/Terminal.styled";
import {
  completeCommand,
  parseCommand,
  themeFromArguments,
} from "../utils/command";
import { findCommand, CommandName } from "../data/commands";
import { termContext } from "./TerminalContext";
import { themeContext } from "./ThemeContext";
import {
  homeDirectory,
  resolveDirectoryPath,
  resolveGamePath,
} from "../data/filesystem";

type CommandEntry = ReturnType<typeof parseCommand> & {
  id: number;
  command: string;
  directory: string;
  error?: string;
  game?: "dino";
  gameRun?: DinoRun;
};

const Terminal = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const nextEntryId = useRef(1);
  const themeSwitcher = useContext(themeContext);
  const [inputVal, setInputVal] = useState("");
  const [entries, setEntries] = useState<CommandEntry[]>([
    {
      id: 0,
      command: "welcome",
      name: "welcome",
      args: [],
      directory: homeDirectory,
    },
  ]);
  const [currentDirectory, setCurrentDirectory] = useState(homeDirectory);
  const [hints, setHints] = useState<string[]>([]);
  const [pointer, setPointer] = useState(-1);
  const [activeGameId, setActiveGameId] = useState<number | null>(null);
  const exitGame = useCallback(
    (run: DinoRun | null) => {
      if (run) {
        setEntries(previous =>
          previous.map(entry =>
            entry.id === activeGameId ? { ...entry, gameRun: run } : entry
          )
        );
      }
      setActiveGameId(null);
    },
    [activeGameId]
  );

  const clearHistory = () => {
    setEntries([]);
    setHints([]);
    setPointer(-1);
    setActiveGameId(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (activeGameId !== null) return;
    const parsed = parseCommand(inputVal);
    const { name, args } = parsed;
    const game = resolveGamePath(name, currentDirectory);
    let error: string | undefined;
    // Effects run once when submitted. Historical output only renders results.
    if (game && args.length > 0) error = `Usage: ${name}`;
    if (name === "cd") {
      const destination =
        args.length <= 1
          ? resolveDirectoryPath(args[0] ?? "~", currentDirectory)
          : null;
      if (args.length > 1) error = "Usage: cd [directory]";
      else if (destination === null)
        error = `cd: ${args[0]}: No such directory`;
      else setCurrentDirectory(destination);
    }
    const nextTheme = name === "themes" ? themeFromArguments(args) : null;
    if (nextTheme) themeSwitcher?.(nextTheme);
    if (name === "clear" && args.length === 0) {
      clearHistory();
    } else {
      const entry: CommandEntry = {
        ...parsed,
        id: nextEntryId.current++,
        command: inputVal,
        directory: currentDirectory,
        error,
        game: game ?? undefined,
      };
      setActiveGameId(game && !error ? entry.id : null);
      setEntries(previous => [entry, ...previous]);
    }
    setInputVal("");
    setHints([]);
    setPointer(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      event.key === "Tab" ||
      (event.ctrlKey && event.key.toLowerCase() === "i")
    ) {
      event.preventDefault();
      const { prefix, candidates } = completeCommand(
        inputVal,
        currentDirectory
      );
      if (candidates.length === 1) setInputVal(`${prefix}${candidates[0]}`);
      setHints(candidates.length > 1 ? candidates : []);
    } else if (event.ctrlKey && event.key.toLowerCase() === "l") {
      event.preventDefault();
      clearHistory();
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const nextPointer =
        event.key === "ArrowUp"
          ? Math.min(pointer + 1, entries.length - 1)
          : Math.max(pointer - 1, -1);
      setPointer(nextPointer);
      setInputVal(nextPointer < 0 ? "" : entries[nextPointer].command);
      setHints([]);
    }
  };

  useLayoutEffect(() => {
    if (
      activeGameId !== null ||
      document.activeElement?.closest("[data-terminal-interactive]")
    )
      return;
    const input = inputRef.current;
    input?.focus();
    input?.setSelectionRange(input.value.length, input.value.length);
  }, [pointer, activeGameId]);

  return (
    <Wrapper
      data-testid="terminal-wrapper"
      onClick={event => {
        if (
          activeGameId === null &&
          event.target instanceof Element &&
          !event.target.closest("[data-terminal-interactive], a, button, input")
        )
          inputRef.current?.focus();
      }}
    >
      {hints.length > 1 && (
        <div>
          {hints.map(hint => (
            <Hints key={hint}>{hint}</Hints>
          ))}
        </div>
      )}
      <Form onSubmit={handleSubmit}>
        <label htmlFor="terminal-input">
          <TermInfo directory={currentDirectory} /> <MobileBr />
          <MobileSpan>&#62;</MobileSpan>
        </label>
        <Input
          title="terminal-input"
          type="text"
          id="terminal-input"
          autoComplete="off"
          spellCheck="false"
          autoFocus
          autoCapitalize="off"
          ref={inputRef}
          value={inputVal}
          disabled={activeGameId !== null}
          onKeyDown={handleKeyDown}
          onChange={event => {
            setInputVal(event.target.value);
            setHints([]);
          }}
        />
      </Form>
      {entries.map(
        (
          { id, command, name, args, directory, error, game, gameRun },
          index
        ) => (
          <div key={id}>
            <div>
              <TermInfo directory={directory} />
              <MobileBr />
              <MobileSpan>&#62;</MobileSpan>
              <span data-testid="input-command">{command}</span>
            </div>
            {game ? (
              error ? (
                <CmdNotFound>{error}</CmdNotFound>
              ) : activeGameId === id ? (
                <div data-testid={index === 0 ? "latest-output" : undefined}>
                  <DinoGame onExit={exitGame} />
                </div>
              ) : gameRun ? (
                <div data-testid={index === 0 ? "latest-output" : undefined}>
                  <GameHint data-testid="dino-run-summary">
                    dino ended · score {String(gameRun.score).padStart(5, "0")}{" "}
                    ·{" "}
                    <time dateTime={new Date(gameRun.endedAt).toISOString()}>
                      {formatTimestamp(gameRun.endedAt)}
                    </time>
                  </GameHint>
                </div>
              ) : null
            ) : findCommand(name) ? (
              <termContext.Provider
                value={{
                  arg: args,
                  directory,
                  commandError: error,
                  isCurrent: index === 0 && activeGameId === null,
                }}
              >
                <Output index={index} cmd={name as CommandName} />
              </termContext.Provider>
            ) : name === "" ? (
              <Empty />
            ) : (
              <CmdNotFound data-testid={`not-found-${index}`}>
                command not found: {command}
              </CmdNotFound>
            )}
          </div>
        )
      )}
    </Wrapper>
  );
};

export default Terminal;
