import { vi } from "vitest";
import { act, renderHook } from "../utils/test-utils";
import { useTheme } from "../hooks/useTheme";
import themes from "../components/styles/themes";

describe("Theme persistence", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each(["removed-theme", "__proto__", "constructor"])(
    "falls back when stored theme %s is invalid",
    name => {
      vi.stubGlobal("localStorage", { getItem: () => name });
      const { result } = renderHook(useTheme);
      expect(result.current.theme).toBe(themes.dark);
    }
  );

  it("loads a saved theme and switches even when storage writes are denied", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => "light",
      setItem: () => {
        throw new Error("Storage unavailable");
      },
    });
    const { result } = renderHook(useTheme);
    expect(result.current.theme).toBe(themes.light);
    act(() => result.current.setMode(themes.ubuntu));
    expect(result.current.theme).toBe(themes.ubuntu);
  });

  it("starts safely when access to storage is denied", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("Storage unavailable");
      },
    });
    const { result } = renderHook(useTheme);
    expect(result.current.theme).toBe(themes.dark);
  });
});
