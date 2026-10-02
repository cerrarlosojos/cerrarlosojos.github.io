import styled, { keyframes } from "styled-components";

export const LockForm = styled.form`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;

  input {
    box-sizing: border-box;
    width: 8ch;
    padding: 0.4rem 0.6rem;
    border: 1px solid ${({ theme }) => theme.colors?.text[300]};
    border-radius: 2px;
    background: transparent;
    color: ${({ theme }) => theme.colors?.primary};
    font: inherit;
    letter-spacing: 0.15em;
  }
  button {
    padding: 0.4rem 0;
    background: transparent;
    color: ${({ theme }) => theme.colors?.primary};
    font: inherit;
    cursor: pointer;
  }
  input:focus-visible,
  button:focus-visible {
    outline: 1px solid ${({ theme }) => theme.colors?.primary};
    outline-offset: 3px;
  }
  input:disabled,
  button:disabled {
    opacity: 0.5;
  }
`;

export const MemoryHint = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors?.text[200]};
  & + & {
    margin-top: 0.65rem;
  }
  &[role="alert"] {
    margin-top: 1rem;
  }
`;

const rotation = keyframes`
  from { transform: rotateX(-22deg) rotateY(-35deg); }
  to { transform: rotateX(-22deg) rotateY(325deg); }
`;
const float = keyframes`
  0%, 100% { transform: translateY(-5px); }
  50% { transform: translateY(5px); }
`;

export const MemoryScene = styled.div`
  position: relative;
  display: grid;
  place-items: center;
  height: 20rem;
  overflow: hidden;
  border-radius: 2px;
  isolation: isolate;
  background: radial-gradient(ellipse at 50% 38%, #b7b5a7 0%, transparent 68%),
    linear-gradient(145deg, #74756c, #8c8d80 50%, #51564f);

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.18;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' opacity='.55' filter='url(%23n)'/%3E%3C/svg%3E");
    mix-blend-mode: multiply;
  }
  &::after {
    content: "";
    position: absolute;
    bottom: 3.1rem;
    left: calc(50% - 3.5rem);
    width: 7rem;
    height: 1rem;
    border-radius: 50%;
    background: #161a14;
    opacity: 0.28;
    filter: blur(9px);
  }
`;

export const CubeLink = styled.a`
  --edge: clamp(64px, 16vw, 86px);
  --half: calc(var(--edge) / 2);
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 13rem;
  height: 13rem;
  max-width: 100%;
  perspective: 650px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  outline: none;

  .levitation {
    display: block;
    animation: ${float} 5s ease-in-out infinite;
  }
  .cube {
    display: block;
    position: relative;
    width: var(--edge);
    height: var(--edge);
    transform-style: preserve-3d;
    animation: ${rotation} 18s linear infinite;
  }
  .face {
    position: absolute;
    inset: 0;
    box-sizing: border-box;
    border: 1px solid #030403;
    backface-visibility: hidden;
    background: #050605;
  }
  .front {
    transform: translateZ(var(--half));
    background: #060706;
  }
  .back {
    transform: rotateY(180deg) translateZ(var(--half));
    background: #030403;
  }
  .right {
    transform: rotateY(90deg) translateZ(var(--half));
    background: #0b0c09;
  }
  .left {
    transform: rotateY(-90deg) translateZ(var(--half));
    background: #020302;
  }
  .top {
    transform: rotateX(90deg) translateZ(var(--half));
    background: #171812;
  }
  .bottom {
    transform: rotateX(-90deg) translateZ(var(--half));
    background: #010201;
  }
  .face::after {
    content: "";
    position: absolute;
    inset: 0;
    opacity: 0.18;
    background: repeating-linear-gradient(
      113deg,
      transparent 0 15px,
      #34362a 16px,
      transparent 17px 29px
    );
  }
  &:focus {
    outline: none;
  }
  &:focus-visible .face {
    border-color: #292d22;
  }
  &:hover .cube {
    animation-play-state: paused;
  }
  @media (prefers-reduced-motion: reduce) {
    .levitation {
      animation: none;
    }
    .cube {
      animation: none;
      transform: rotateX(-22deg) rotateY(-35deg);
    }
  }
`;
