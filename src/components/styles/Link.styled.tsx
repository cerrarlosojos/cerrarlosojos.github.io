import styled from "styled-components";

export const Link = styled.a.attrs<{ href: string }>(({ href }) => ({
  target: /^https?:\/\//.test(href) ? "_blank" : undefined,
  rel: /^https?:\/\//.test(href) ? "noreferrer" : undefined,
}))`
  color: ${({ theme }) => theme.colors?.secondary};
  text-decoration: none;
  line-height: 1.5rem;
  overflow-wrap: anywhere;
  border-bottom: 2px dashed ${({ theme }) => theme.colors?.secondary};

  &:hover {
    border-bottom-style: solid;
  }
`;
