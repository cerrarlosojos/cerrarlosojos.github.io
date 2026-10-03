import styled, { keyframes } from "styled-components";

const revealMemory = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const GameMemoryCue = styled.svg`
  position: absolute;
  top: 1.75rem;
  right: 0.65rem;
  z-index: 1;
  width: 1.75rem;
  height: 2rem;
  pointer-events: none;
  stroke: #777c6b;
  stroke-width: 0.65;
  stroke-linejoin: round;
  filter: drop-shadow(0 2px 3px #0004);
  animation: ${revealMemory} 450ms ease-out both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

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
