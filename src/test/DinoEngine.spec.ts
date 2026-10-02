import { vi } from "vitest";
import { Runner } from "../vendor/dino/resources/dino_game/offline.js";

describe("Embedded engine isolation and cleanup", () => {
  let host: HTMLDivElement;
  let runner: Runner | undefined;
  let now = 0;
  let nextFrame = 0;
  const callbacks = new Map<number, FrameRequestCallback>();
  const frame = vi.fn((callback: FrameRequestCallback) => {
    callbacks.set(++nextFrame, callback);
    return nextFrame;
  });
  const cancelFrame = vi.fn((id: number) => callbacks.delete(id));
  const advanceFrames = () => {
    for (let tick = 0; tick < 60; tick++) {
      now += 16;
      const pending = Array.from(callbacks.values());
      callbacks.clear();
      pending.forEach(callback => callback(now));
    }
  };

  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", frame);
    vi.stubGlobal("cancelAnimationFrame", cancelFrame);
    vi.stubGlobal("AudioContext", undefined);
    now = 0;
    callbacks.clear();
    vi.spyOn(performance, "now").mockImplementation(() => now);
    const context = {
      drawImage: vi.fn(),
      clearRect: vi.fn(),
      fill: vi.fn(),
      rect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      translate: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context
    );
    host = document.createElement("div");
    host.tabIndex = 0;
    host.style.padding = "0px";
    Object.defineProperty(host, "offsetWidth", { value: 584 });
    document.body.appendChild(host);
    host.focus();
    frame.mockClear();
    cancelFrame.mockClear();
  });

  afterEach(() => {
    runner?.destroy();
    runner = undefined;
    host.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const start = (highScore = 0, onGameOver = vi.fn()) => {
    runner = new Runner(host, undefined, {
      sprite: new Image(),
      sounds: {},
      highScore,
      onGameOver,
    });
    return runner;
  };

  it("scopes controls to the game and removes blur and visibility handlers", () => {
    const addDocument = vi.spyOn(document, "addEventListener");
    const removeDocument = vi.spyOn(document, "removeEventListener");
    const addWindow = vi.spyOn(window, "addEventListener");
    const removeWindow = vi.spyOn(window, "removeEventListener");
    const game = start();
    expect(addDocument.mock.calls.some(([type]) => type === "keydown")).toBe(
      false
    );
    const framesBefore = frame.mock.calls.length;
    document.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 32 }));
    expect(frame.mock.calls).toHaveLength(framesBefore);
    host.dispatchEvent(
      new KeyboardEvent("keydown", { keyCode: 32, bubbles: true })
    );
    host.dispatchEvent(
      new KeyboardEvent("keyup", { keyCode: 32, bubbles: true })
    );
    advanceFrames();
    expect(
      addDocument.mock.calls.some(([type]) => type === "visibilitychange")
    ).toBe(true);
    game.destroy();
    expect(addWindow.mock.calls.some(([type]) => type === "resize")).toBe(
      false
    );
    game.destroy(); // Cleanup is idempotent.
    expect(cancelFrame).toHaveBeenCalled();
    expect(host.querySelector("canvas")).toBeNull();
    const framesAfter = frame.mock.calls.length;
    host.dispatchEvent(
      new KeyboardEvent("keydown", { keyCode: 32, bubbles: true })
    );
    window.dispatchEvent(new Event("focus"));
    expect(frame.mock.calls).toHaveLength(framesAfter);
    for (const [type, handler] of addDocument.mock.calls) {
      if (type === "visibilitychange")
        expect(removeDocument).toHaveBeenCalledWith(type, handler, undefined);
    }
    const blurHandler = addWindow.mock.calls.find(
      ([type]) => type === "blur"
    )?.[1];
    expect(removeWindow).toHaveBeenCalledWith("blur", blurHandler, undefined);
  });

  it("can destroy and recreate a game without changing page classes or stylesheets", () => {
    const pageClasses = [
      document.documentElement.className,
      document.body.className,
    ];
    const sheets = document.styleSheets.length;
    start().destroy();
    start();
    host.dispatchEvent(
      new KeyboardEvent("keydown", { keyCode: 32, bubbles: true })
    );
    host.dispatchEvent(
      new KeyboardEvent("keyup", { keyCode: 32, bubbles: true })
    );
    advanceFrames();
    expect(host.querySelectorAll("canvas")).toHaveLength(1);
    expect([
      document.documentElement.className,
      document.body.className,
    ]).toEqual(pageClasses);
    expect(document.styleSheets.length).toBe(sheets);
    expect("Runner" in window).toBe(false);
    expect("initializeEasterEggHighScore" in window).toBe(false);
  });

  it("reports the last displayed score even when an earlier high score is greater", () => {
    const completed = vi.fn();
    const game = start(1000000, completed) as Runner & {
      distanceRan: number;
      gameOver: () => void;
      distanceMeter: { getActualDistance: (distance: number) => number };
    };
    host.dispatchEvent(
      new KeyboardEvent("keydown", { keyCode: 32, bubbles: true })
    );
    host.dispatchEvent(
      new KeyboardEvent("keyup", { keyCode: 32, bubbles: true })
    );
    advanceFrames();
    game.distanceRan = 20512;
    const visibleScore = game.distanceMeter.getActualDistance(
      Math.ceil(game.distanceRan)
    );
    game.gameOver();
    expect(completed).toHaveBeenLastCalledWith(1000000, visibleScore);
    expect(visibleScore).toBeGreaterThan(500);
  });
});
