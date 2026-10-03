import styled from "styled-components";
import { HelpPanel } from "./Help.styled";

export const DetailedListingPanel = styled(HelpPanel)`
  max-width: 68rem;
`;

export const LongDirectoryListing = styled.div`
  max-width: 100%;
  overflow-x: auto;

  table {
    border-collapse: collapse;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    color: ${({ theme }) => theme.colors?.text[200]};
  }

  td {
    padding: 0.2rem 1.5ch 0.2rem 0;
  }

  td:last-child {
    padding-right: 0;
  }

  .numeric {
    text-align: right;
  }

  .name {
    color: ${({ theme }) => theme.colors?.primary};
  }

  &:focus-visible {
    outline: 1px solid ${({ theme }) => theme.colors?.primary};
    outline-offset: 4px;
  }
`;

export const DirectoryListing = styled.dl<{ $files: boolean }>`
  display: grid;
  grid-template-columns: 17ch minmax(0, 1fr);
  column-gap: 2ch;
  row-gap: ${({ $files }) => ($files ? "1rem" : "0.5rem")};
  margin: 0;

  dt {
    color: ${({ theme }) => theme.colors?.primary};
    overflow-wrap: anywhere;
  }

  dd {
    min-width: 0;
    margin: 0;
    color: ${({ theme }) => theme.colors?.text[200]};
    overflow-wrap: anywhere;
  }

  @media (max-width: 480px) {
    ${({ $files }) =>
      $files &&
      `
      grid-template-columns: minmax(0, 1fr);
      row-gap: 0.25rem;

      dd:not(:last-child) {
        margin-bottom: 0.75rem;
      }
    `}
  }
`;

export const FileLink = styled.a`
  color: inherit;
  text-decoration: none;
  border-bottom: 1px dashed currentColor;

  &:hover {
    border-bottom-style: solid;
  }
`;
