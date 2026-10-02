import { createContext } from "react";
import { homeDirectory } from "../data/filesystem";

type Term = {
  arg: string[];
  directory: string;
  commandError?: string;
  isCurrent: boolean;
};

export const termContext = createContext<Term>({
  arg: [],
  directory: homeDirectory,
  isCurrent: true,
});
