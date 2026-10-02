import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "styled-components";
import type { DinoSession } from "../games/createDinoRunner";
import { HelpPanel, PanelTitle } from "./styles/Help.styled";
import { GameControls, GameHint, GameViewport } from "./styles/DinoGame.styled";

type Props = { onExit: () => void };

const DinoGame: React.FC<Props> = ({ onExit }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hintId = useId();
  const theme = useTheme();
  const color = theme?.colors?.primary ?? "#05CE91";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const controller = new AbortController();
    let session: DinoSession | null = null;
    setLoading(true);
    setError(false);
    container.focus();

    import("../games/createDinoRunner")
      .then(({ createDinoRunner }) =>
        createDinoRunner(container, { color, signal: controller.signal })
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
            onExit();
          }
        }}
      >
        <PanelTitle>dino</PanelTitle>
        <GameControls>
          <button type="button" onClick={onExit}>
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
        </GameViewport>
      </HelpPanel>
      <GameHint id={hintId}>
        Space / ↑ jump · ↓ duck · Enter restart · Esc exit · Tap to jump
      </GameHint>
    </>
  );
};

export default DinoGame;
