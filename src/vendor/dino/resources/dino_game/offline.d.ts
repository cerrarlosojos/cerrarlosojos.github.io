export type RunnerOptions = {
  sprite: HTMLImageElement;
  sounds: Record<string, string>;
  highScore: number;
  onGameOver: (highScore: number, score: number) => void;
  onScoreChange?: (score: number) => void;
};

export class Runner {
  constructor(
    container: HTMLElement,
    config: Record<string, number> | undefined,
    options: RunnerOptions
  );
  adjustDimensions(): void;
  destroy(): void;
}
