import type { Entry } from "../data/filesystem";
import { readSealedMemory } from "../games/dinoMemory";

export const getEntryMetadata = (entry: Entry) => {
  const directory = entry.kind === "directory";
  const memory =
    entry.kind === "file" && entry.encrypted === "memory"
      ? readSealedMemory()
      : null;
  // These entries are read-only. Remote downloads and directories have no
  // local byte size, and static entries have no recorded modification time.
  const size =
    directory || entry.url
      ? null
      : entry.encrypted
      ? memory
        ? new TextEncoder().encode(JSON.stringify(memory)).length
        : 0
      : new TextEncoder().encode(entry.content).length;

  return {
    permissions: directory
      ? "dr-xr-xr-x"
      : entry.executable
      ? "-r-xr-xr-x"
      : "-r--r--r--",
    links: directory
      ? 2 + entry.children.filter(child => child.kind === "directory").length
      : 1,
    size,
    modifiedAt: memory?.modifiedAt ?? null,
  };
};
