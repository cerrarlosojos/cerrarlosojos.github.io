import styled from "styled-components";

export const FileContent = styled.pre`
  margin: 0;
  font: inherit;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: ${({ theme }) => theme.colors?.text[200]};

  a {
    color: ${({ theme }) => theme.colors?.primary};
  }
`;

export const MarkdownContent = styled.article`
  color: ${({ theme }) => theme.colors?.text[200]};
  overflow-wrap: anywhere;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 1.25rem 0 0.5rem;
    color: ${({ theme }) => theme.colors?.primary};
    line-height: 1.35;
  }

  h1 {
    font-size: 1.5rem;
  }

  h2 {
    font-size: 1.25rem;
  }

  h3,
  h4,
  h5,
  h6 {
    font-size: 1rem;
  }

  p,
  ul,
  ol,
  blockquote,
  pre,
  .table-wrapper {
    margin: 0.75rem 0;
  }

  ul,
  ol {
    padding-left: 1.5rem;
  }

  li + li {
    margin-top: 0.25rem;
  }

  li > p {
    margin: 0.25rem 0;
  }

  code {
    padding: 0.1rem 0.3rem;
    border: 1px solid ${({ theme }) => theme.colors?.text[300]};
    border-radius: 0.2rem;
    color: ${({ theme }) => theme.colors?.secondary};
    font-family: inherit;
  }

  pre {
    padding: 0.75rem 1rem;
    border: 1px solid ${({ theme }) => theme.colors?.text[300]};
    border-radius: 0.25rem;
    overflow-x: auto;
    font: inherit;
    white-space: pre;
  }

  pre code {
    padding: 0;
    border: 0;
    color: inherit;
  }

  blockquote {
    margin-left: 0;
    padding-left: 1rem;
    border-left: 2px solid ${({ theme }) => theme.colors?.text[300]};
  }

  hr {
    margin: 1rem 0;
    border: 0;
    border-top: 1px solid ${({ theme }) => theme.colors?.text[300]};
  }

  img {
    max-width: 100%;
    height: auto;
  }

  .table-wrapper {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 0.5rem 0.75rem;
    border: 1px solid ${({ theme }) => theme.colors?.text[300]};
    text-align: left;
  }

  th {
    color: ${({ theme }) => theme.colors?.primary};
  }

  > :first-child {
    margin-top: 0;
  }

  > :last-child {
    margin-bottom: 0;
  }
`;

export const MarkdownMetadata = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
  margin: 0.5rem 0 1rem;
  font-size: 0.75rem;

  span {
    padding: 0.1rem 0.5rem;
    border: 1px solid ${({ theme }) => theme.colors?.text[300]};
    border-radius: 0.25rem;
    color: ${({ theme }) => theme.colors?.secondary};
  }
`;
