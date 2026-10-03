import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "styled-components";
import type { DinoRun, DinoSession } from "../games/createDinoRunner";
import { HelpPanel, PanelTitle } from "./styles/Help.styled";
import {
  GameControls,
  GameHint,
  GameMemoryCue,
  GameViewport,
} from "./styles/DinoGame.styled";

type Props = { onExit: (run: DinoRun | null) => void };

const DinoGame: React.FC<Props> = ({ onExit }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastRun = useRef<DinoRun | null>(null);
  const hintId = useId();
  const theme = useTheme();
  const color = theme?.colors?.primary ?? "#05CE91";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [memoryCueVisible, setMemoryCueVisible] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const controller = new AbortController();
    let session: DinoSession | null = null;
    setLoading(true);
    setError(false);
    setMemoryCueVisible(false);
    container.focus();

    import("../games/createDinoRunner")
      .then(({ createDinoRunner }) =>
        createDinoRunner(container, {
          color,
          signal: controller.signal,
          onRunEnd: run => {
            lastRun.current = run;
          },
          onMemoryCueChange: setMemoryCueVisible,
        })
      )
      .then(createdSession => {
        session = createdSession;
        if (controller.signal.aborted) {
          session?.destroy();
          return;
        }
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setError(true);
        }
      });

    return () => {
      controller.abort();
      session?.destroy();
    };
  }, [color]);

  return (
    <>
      <HelpPanel
        data-testid="dino"
        onKeyDown={event => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            onExit(lastRun.current);
          }
        }}
      >
        <PanelTitle>dino</PanelTitle>
        <GameControls>
          <button type="button" onClick={() => onExit(lastRun.current)}>
            Exit [Esc]
          </button>
        </GameControls>
        <GameViewport
          ref={containerRef}
          role="application"
          aria-label="Dinosaur runner"
          aria-describedby={hintId}
          tabIndex={0}
          onClick={() => containerRef.current?.focus()}
        >
          {loading && <span role="status">Loading…</span>}
          {error && <span role="alert">Unable to load the game.</span>}
          {memoryCueVisible && (
            <GameMemoryCue
              role="img"
              aria-label="A small black cube"
              viewBox="0 0 32 36"
            >
              <path d="M16 2 30 10 16 18 2 10Z" fill="#171812" />
              <path d="M2 10 16 18 16 34 2 26Z" fill="#060706" />
              <path d="M16 18 30 10 30 26 16 34Z" fill="#0b0c09" />
            </GameMemoryCue>
          )}
        </GameViewport>
      </HelpPanel>
      <GameHint id={hintId}>
        Space / ↑ jump · ↓ duck · Enter restart · Esc exit · Tap to jump
      </GameHint>
    </>
  );
};

export default DinoGame;
