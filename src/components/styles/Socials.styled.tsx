import styled from "styled-components";

export const SocialList = styled.ul`
  max-width: 48rem;
  margin: 0.5rem 0 0.75rem;
  padding-left: 1.25rem;
  list-style: disc;
  line-height: 1.5rem;

  > li + li {
    margin-top: 0.875rem;
  }

  > li::marker {
    color: ${({ theme }) => theme.colors?.primary};
  }
`;

export const SocialTitle = styled.span`
  display: inline-block;
  min-width: 13ch;
  margin-right: 1rem;
  color: ${({ theme }) => theme.colors?.primary};

  @media (max-width: 550px) {
    display: block;
    margin-bottom: 0.25rem;
  }
`;

export const PublicationList = styled.div`
  margin-top: 0.25rem;
  overflow-wrap: anywhere;

  > article + article {
    margin-top: 0.75rem;
  }
`;
