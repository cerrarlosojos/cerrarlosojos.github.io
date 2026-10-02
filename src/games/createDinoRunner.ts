import { Runner } from "../vendor/dino/resources/dino_game/offline.js";
import { IS_HIDPI } from "../vendor/dino/resources/dino_game/constants.js";
import sprite1x from "../vendor/dino/images/default_100_percent/100-offline-sprite.png";
import sprite2x from "../vendor/dino/images/default_200_percent/200-offline-sprite.png";
import jumpSound from "../vendor/dino/audio/press.ogg";
import hitSound from "../vendor/dino/audio/hit.ogg";
import scoreSound from "../vendor/dino/audio/reached.ogg";
import { recordDinoRun } from "./dinoMemory";
import { getFromLS, setToLS } from "../utils/storage";

export type DinoSession = {
  destroy: () => void;
};

const highScoreKey = "terminal-dino-high-score";

const loadSprite = async (color: string) => {
  const source = new Image();
  // The engine captures its sprite coordinates when the module loads. Use the
  // same density even if the window moves between displays before a new game.
  source.src = IS_HIDPI ? sprite2x : sprite1x;
  await source.decode();
  const canvas = document.createElement("canvas");
  canvas.width = source.naturalWidth;
  canvas.height = source.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");
  context.drawImage(source, 0, 0);
  context.globalCompositeOperation = "source-in";
  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const sprite = new Image();
  sprite.src = canvas.toDataURL();
  await sprite.decode();
  return sprite;
};

const readHighScore = () => {
  const score = Number(getFromLS(highScoreKey));
  return Number.isFinite(score) && score >= 0 && score <= 1e9 ? score : 0;
};

export const createDinoRunner = async (
  container: HTMLElement,
  options: { color: string; signal: AbortSignal }
): Promise<DinoSession | null> => {
  const sprite = await loadSprite(options.color);
  if (options.signal.aborted) return null;

  const runner = new Runner(container, undefined, {
    sprite,
    sounds: { BUTTON_PRESS: jumpSound, HIT: hitSound, SCORE: scoreSound },
    highScore: readHighScore(),
    onGameOver: (highScore, score) => {
      void recordDinoRun(score);
      setToLS(highScoreKey, String(highScore));
    },
  });

  const observer = new ResizeObserver(() => runner.adjustDimensions());
  observer.observe(container);

  return {
    destroy: () => {
      observer.disconnect();
      runner.destroy();
    },
  };
};
