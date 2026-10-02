import { commands, findCommand } from "../data/commands";
import { pathCompletions } from "../data/filesystem";
import themes from "../components/styles/themes";

export const parseCommand = (input: string) => {
  const [name = "", ...args] = input.trim().split(/\s+/);
  return { name, args };
};

export const themeFromArguments = (args: string[]) =>
  args.length === 2 &&
  args[0] === "set" &&
  Object.prototype.hasOwnProperty.call(themes, args[1])
    ? themes[args[1]]
    : null;

// Return replacement candidates without mutating input or terminal state.
export const completeCommand = (input: string, directory: string) => {
  const match = /^(.*\s)?(\S*)$/.exec(input);
  const prefix = match?.[1] ?? "";
  const partial = match?.[2] ?? "";
  let candidates: string[] = [];
  if (!prefix) {
    candidates = partial.includes("/")
      ? pathCompletions(partial, directory, "executable")
      : partial
      ? commands.map(({ cmd }) => cmd).filter(cmd => cmd.startsWith(partial))
      : [];
  } else {
    const { name, args } = parseCommand(prefix);
    const completion = findCommand(name)?.completion;
    if (completion === "theme") {
      const options =
        args.length === 0
          ? ["set"]
          : args.length === 1 && args[0] === "set"
          ? Object.keys(themes)
          : [];
      candidates = options.filter(option => option.startsWith(partial));
    } else if (completion) {
      candidates = pathCompletions(partial, directory, completion);
    }
  }
  return { prefix, candidates };
};
