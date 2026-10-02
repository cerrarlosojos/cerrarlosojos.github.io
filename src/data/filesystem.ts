import { profile, publications } from "./profile";
import firstBlog from "./blog/first-blog.md?raw";

type File = {
  kind: "file";
  name: string;
  description: string;
  content: string;
  url?: string;
  executable?: "dino";
  encrypted?: "memory";
};
type Directory = {
  kind: "directory";
  name: string;
  description: string;
  children: Entry[];
};
type Entry = File | Directory;

export const homeDirectory = `/home/${profile.username}`;

// A curated tree, independent of the computer's filesystem. All commands and
// completion use the same entries, including the real virtual parents of ~.
const root: Directory = {
  kind: "directory",
  name: "",
  description: "",
  children: [
    {
      kind: "directory",
      name: "home",
      description: "Home directories",
      children: [
        {
          kind: "directory",
          name: profile.username,
          description: `${profile.name}'s homepage`,
          children: [
            {
              kind: "directory",
              name: "Publications",
              description: "Research papers & preprints",
              children: publications.map(({ filename, title, desc, pdf }) => ({
                kind: "file",
                name: filename,
                description: title,
                content: desc,
                url: pdf,
              })),
            },
            {
              kind: "directory",
              name: "Blog",
              description: "Notes & posts",
              children: [
                {
                  kind: "file",
                  name: "first-blog.md",
                  description: "A Hello World opening post (2025-11-30)",
                  content: firstBlog,
                },
                {
                  kind: "file",
                  name: ".dejavu.txt",
                  description: "Some memories refuse to stay buried.",
                  content: "[encrypted memory]",
                  encrypted: "memory",
                },
              ],
            },
            {
              kind: "directory",
              name: ".Games",
              description: "Hidden arcade",
              children: [
                {
                  kind: "file",
                  name: "dino",
                  description: "You know this little guy.",
                  content:
                    "Run ./.Games/dino from home, or cd .Games and run ./dino.\nSpace / Up: jump\nDown: duck\nEnter: restart after a crash\nEsc: exit",
                  executable: "dino",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const entryAt = (parts: string[]): Entry | undefined => {
  let entry: Entry | undefined = root;
  for (const part of parts) {
    entry =
      entry?.kind === "directory"
        ? entry.children.find(child => child.name === part)
        : undefined;
  }
  return entry;
};

export const displayDirectoryPath = (path: string) =>
  path === homeDirectory
    ? "~"
    : path.startsWith(`${homeDirectory}/`)
    ? `~${path.slice(homeDirectory.length)}`
    : path;

// Walk each segment so invalid intermediate directories cannot disappear
// through .., and files cannot be traversed as directories.
export const resolveEntry = (
  path: string,
  currentDirectory = homeDirectory
) => {
  const expanded =
    path === "~"
      ? homeDirectory
      : path.startsWith("~/")
      ? `${homeDirectory}/${path.slice(2)}`
      : path;
  const parts = expanded.startsWith("/")
    ? []
    : currentDirectory.split("/").filter(Boolean);
  let entry = entryAt(parts);
  for (const part of expanded.split("/")) {
    if (entry?.kind !== "directory") return null;
    if (!part || part === ".") continue;
    if (part === "..") {
      parts.pop();
      entry = entryAt(parts);
      continue;
    }
    entry = entry.children.find(child =>
      child.kind === "directory"
        ? child.name.toLowerCase() === part.toLowerCase()
        : child.name === part
    );
    if (!entry) return null;
    parts.push(entry.name);
  }
  return entry ? { entry, path: `/${parts.join("/")}` } : null;
};

export const resolveDirectoryPath = (
  path: string,
  currentDirectory = homeDirectory
) => {
  const resolved = resolveEntry(path, currentDirectory);
  return resolved?.entry.kind === "directory" ? resolved.path : null;
};

export const listDirectory = (path: string) => {
  const resolved = resolveEntry(path);
  return resolved?.entry.kind === "directory" ? resolved.entry.children : [];
};

export const resolveGamePath = (
  path: string,
  currentDirectory = homeDirectory
) => {
  // Executables require a path, as in a shell without . on PATH.
  const resolved = path.includes("/")
    ? resolveEntry(path, currentDirectory)
    : null;
  return resolved?.entry.kind === "file"
    ? resolved.entry.executable ?? null
    : null;
};

export const pathCompletions = (
  path: string,
  currentDirectory: string,
  kind: "directory" | "file" | "markdown" | "executable"
) => {
  const lastSlash = path.lastIndexOf("/");
  const prefix = path.slice(0, lastSlash + 1);
  const partial = path.slice(lastSlash + 1).toLowerCase();
  const parent = resolveDirectoryPath(prefix, currentDirectory);
  if (parent === null) return [];
  return listDirectory(parent)
    .filter(
      entry =>
        entry.name.toLowerCase().startsWith(partial) &&
        (!entry.name.startsWith(".") || partial.startsWith(".")) &&
        (entry.kind === "directory" ||
          kind === "file" ||
          (kind === "markdown" && entry.name.endsWith(".md")) ||
          (kind === "executable" && entry.executable))
    )
    .map(
      entry => `${prefix}${entry.name}${entry.kind === "directory" ? "/" : ""}`
    );
};
