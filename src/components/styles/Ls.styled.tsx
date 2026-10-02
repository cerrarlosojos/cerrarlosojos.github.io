import styled from "styled-components";

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
