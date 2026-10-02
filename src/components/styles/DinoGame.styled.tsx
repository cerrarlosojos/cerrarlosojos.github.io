import styled from "styled-components";

export const GameControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors?.text[200]};
  font-size: 0.75rem;

  button {
    padding: 0;
    background: transparent;
    color: ${({ theme }) => theme.colors?.primary};
    font: inherit;
    cursor: pointer;
    white-space: nowrap;
  }

  button:focus-visible {
    outline: 1px solid currentColor;
    outline-offset: 4px;
  }
`;

export const GameHint = styled.p`
  max-width: 40rem;
  margin: 0 0 0.75rem;
  color: ${({ theme }) => theme.colors?.text[200]};
  font-size: 0.75rem;
  line-height: 1.5;
`;

export const GameViewport = styled.div`
  position: relative;
  width: 100%;
  height: 150px;
  touch-action: none;
  outline: none;

  .runner-container,
  .runner-canvas {
    width: 100%;
    height: 150px;
    overflow: hidden;
  }

  .runner-canvas {
    display: block;
    image-rendering: pixelated;
  }

  .controller {
    position: absolute;
    inset: 0;
  }

  .hidden,
  .slow-speed-option,
  .offline-runner-live-region {
    display: none;
  }
`;
