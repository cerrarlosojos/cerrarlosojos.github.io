import styled from "styled-components";

export const HeroContainer = styled.div`
  display: flex;
  flex-wrap: wrap-reverse;

  @media (max-width: 932px) {
    margin-bottom: 1.5rem;
  }

  > .info-section {
    flex: 1 1 25rem;
    min-width: 0;
  }

  > .illu-section {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1 1 19rem;
  }

  @media (max-width: 550px) {
    > .illu-section {
      display: none;
    }
  }
`;

export const PreName = styled.pre`
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;

  @media (max-width: 550px) {
    text-align: center;
  }
`;

export const PreImg = styled.pre`
  margin: 0.75rem 0;
`;

export const TennisPortrait = styled.pre`
  flex-shrink: 0;
  font-size: 12px;
  line-height: 1;
  transform: translateX(-2rem);
  user-select: none;
`;

export const Seperator = styled.div`
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
`;

export const Cmd = styled.span`
  color: ${({ theme }) => theme.colors?.primary};
`;
