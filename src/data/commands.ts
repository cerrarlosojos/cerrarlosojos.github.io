import { profile } from "./profile";

export const commandGroups = [
  "General",
  "Navigation",
  "Info",
  "Projects",
] as const;

type Command = {
  cmd: string;
  desc: string;
  group: (typeof commandGroups)[number];
  acceptsArguments?: boolean;
  completion?: "directory" | "file" | "markdown" | "theme";
  hidden?: boolean;
};

export const commands = [
  { cmd: "about", desc: `about ${profile.name}`, group: "Info" },
  {
    cmd: "cat",
    desc: "display file source",
    group: "Navigation",
    acceptsArguments: true,
    completion: "file",
  },
  {
    cmd: "cd",
    desc: "change directory",
    group: "Navigation",
    acceptsArguments: true,
    completion: "directory",
  },
  { cmd: "clear", desc: "clear the terminal", group: "General" },
  {
    cmd: "echo",
    desc: "print out anything",
    group: "General",
    acceptsArguments: true,
  },
  { cmd: "education", desc: "my education background", group: "Info" },
  {
    cmd: "glow",
    desc: "preview Markdown files",
    group: "Navigation",
    acceptsArguments: true,
    completion: "markdown",
  },
  {
    cmd: "help",
    desc: "check available commands",
    group: "General",
    hidden: true,
  },
  {
    cmd: "ls",
    desc: "list directories and files",
    group: "Navigation",
    acceptsArguments: true,
    completion: "file",
  },
  {
    cmd: "projects",
    desc: "view my research project",
    group: "Projects",
  },
  {
    cmd: "pwd",
    desc: "print current working directory",
    group: "Navigation",
  },
  {
    cmd: "socials",
    desc: "GitHub, email, and publications",
    group: "Info",
  },
  { cmd: "teaching", desc: "teaching assistant experience", group: "Info" },
  {
    cmd: "themes",
    desc: "check available themes",
    group: "General",
    acceptsArguments: true,
    completion: "theme",
  },
  { cmd: "welcome", desc: "display hero section", group: "General" },
  { cmd: "whoami", desc: "about current user", group: "Info" },
] as const satisfies readonly Command[];

export type CommandName = (typeof commands)[number]["cmd"];

export const findCommand = (name: string): Command | undefined =>
  commands.find(({ cmd }) => cmd === name);
