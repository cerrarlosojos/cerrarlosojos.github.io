import styled from "styled-components";

export const HelpPanel = styled.fieldset`
  box-sizing: border-box;
  width: 100%;
  max-width: 40rem;
  min-width: 0;
  margin: 0.35rem 0 0.75rem;
  padding: 1.25rem 1.75rem 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors?.text[300]};
  border-radius: 0.25rem;
  font-size: 0.875rem;
  line-height: 1.5;

  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

export const PanelTitle = styled.legend`
  margin-left: -0.5rem;
  padding: 0 0.5rem;
  color: ${({ theme }) => theme.colors?.primary};
  font-weight: 700;
`;

export const HelpSection = styled.section`
  & + & {
    margin-top: 1.5rem;
  }
`;

export const SectionTitle = styled.h2`
  margin: 0 0 1rem;
  color: ${({ theme }) => theme.colors?.text[200]};
  font-size: inherit;
  font-weight: 700;
  text-transform: uppercase;
`;

export const CommandGrid = styled.dl`
  display: grid;
  grid-template-columns: 12ch minmax(0, 1fr);
  column-gap: 2ch;
  row-gap: 0.125rem;
  margin: 0;
  padding-left: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 10ch minmax(0, 1fr);
    column-gap: 1ch;
    padding-left: 0;
  }
`;

export const CommandName = styled.dt`
  color: ${({ theme }) => theme.colors?.primary};
`;

export const CommandDescription = styled.dd`
  min-width: 0;
  margin: 0;
  color: ${({ theme }) => theme.colors?.text[200]};
  overflow-wrap: anywhere;
`;
