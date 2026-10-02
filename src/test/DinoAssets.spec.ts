import { vi } from "vitest";
import { createDinoRunner } from "../games/createDinoRunner";
import { Runner } from "../vendor/dino/resources/dino_game/offline.js";
import sprite2x from "../vendor/dino/images/default_200_percent/200-offline-sprite.png";
import { recordDinoRun } from "../games/dinoMemory";

vi.mock("../games/dinoMemory", () => ({ recordDinoRun: vi.fn() }));

vi.mock("../vendor/dino/resources/dino_game/constants.js", () => ({
  IS_HIDPI: true,
}));
vi.mock("../vendor/dino/resources/dino_game/offline.js", () => ({
  Runner: vi.fn(() => ({
    destroy: vi.fn(),
    adjustDimensions: vi.fn(),
  })),
}));

describe("Dinosaur asset loading", () => {
  const drawImage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // The engine was imported on a Retina display; a later game is opened at 1x.
    vi.stubGlobal("devicePixelRatio", 1);
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {
          /* no layout in jsdom */
        }
        disconnect() {
          /* no layout in jsdom */
        }
      }
    );
    Object.defineProperty(HTMLImageElement.prototype, "decode", {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage,
      fillRect: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      "data:image/png;base64,"
    );
  });

  afterEach(() => {
    delete (HTMLImageElement.prototype as Partial<HTMLImageElement>).decode;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps sprite density consistent with engine coordinates after a display change", async () => {
    const session = await createDinoRunner(document.createElement("div"), {
      color: "#05CE91",
      signal: new AbortController().signal,
    });
    expect(drawImage.mock.calls[0][0]).toHaveAttribute("src", sprite2x);
    expect(Runner).toHaveBeenCalledTimes(1);
    session?.destroy();
  });

  it("does not initialize the engine when loading finishes after cancellation", async () => {
    const controller = new AbortController();
    const loading = createDinoRunner(document.createElement("div"), {
      color: "#05CE91",
      signal: controller.signal,
    });
    controller.abort();
    expect(await loading).toBeNull();
    expect(Runner).not.toHaveBeenCalled();
  });

  it("records the completed visible score independently from the historical high score", async () => {
    const session = await createDinoRunner(document.createElement("div"), {
      color: "#05CE91",
      signal: new AbortController().signal,
    });
    vi.mocked(Runner).mock.calls[0][2].onGameOver(14000, 512);
    expect(recordDinoRun).toHaveBeenCalledWith(512);
    session?.destroy();
  });
});
