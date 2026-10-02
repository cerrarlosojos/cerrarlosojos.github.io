import { webcrypto } from "node:crypto";
import { vi } from "vitest";
import {
  openMemory,
  readSealedMemory,
  recordDinoRun,
} from "../games/dinoMemory";

describe("Dino memory encryption", () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });
    vi.stubGlobal("crypto", webcrypto);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("requires strictly more than 500 and decrypts using four zero-padded digits", async () => {
    expect(await recordDinoRun(500)).toBe(false);
    expect(readSealedMemory()).toBeNull();
    expect(await recordDinoRun(501)).toBe(true);
    const record = readSealedMemory();
    expect(record).not.toBeNull();
    if (!record) throw new Error("Missing encrypted record");
    expect(JSON.stringify(record)).not.toContain("bilibili.com");
    expect(await openMemory("0501", record)).toBe(
      "https://www.bilibili.com/video/BV1PK4y1B76J/"
    );
    await expect(openMemory("0502", record)).rejects.toThrow();
    await expect(openMemory("501", record)).rejects.toThrow();
  });

  it("uses the last completed run rather than the best and locks again after a low score", async () => {
    await recordDinoRun(900);
    await recordDinoRun(600);
    const record = readSealedMemory();
    if (!record) throw new Error("Missing encrypted record");
    await expect(openMemory("0900", record)).rejects.toThrow();
    expect(await openMemory("0600", record)).toContain("bilibili.com");
    await recordDinoRun(499);
    expect(readSealedMemory()).toBeNull();
  });

  it("keeps exactly four digits for scores beyond 9999", async () => {
    await recordDinoRun(10512);
    const record = readSealedMemory();
    if (!record) throw new Error("Missing encrypted record");
    expect(await openMemory("0512", record)).toContain("bilibili.com");
  });

  it("cannot let an older asynchronous encryption overwrite a newer run", async () => {
    const oldRun = recordDinoRun(800);
    await recordDinoRun(30);
    expect(await oldRun).toBe(false);
    expect(readSealedMemory()).toBeNull();
  });

  it("rejects corrupted ciphertext without revealing a destination", async () => {
    await recordDinoRun(777);
    const record = readSealedMemory();
    if (!record) throw new Error("Missing encrypted record");
    const first = record.ciphertext[0] === "A" ? "B" : "A";
    await expect(
      openMemory("0777", {
        ...record,
        ciphertext: first + record.ciphertext.slice(1),
      })
    ).rejects.toThrow();
    window.localStorage.setItem("terminal-dino-encrypted-memory", "not JSON");
    expect(readSealedMemory()).toBeNull();
  });

  it("fails closed when encryption is unavailable", async () => {
    vi.stubGlobal("crypto", {});
    expect(await recordDinoRun(600)).toBe(false);
    expect(readSealedMemory()).toBeNull();
  });

  it("replaces stale persisted keys and stays locked when storage writes fail", async () => {
    await recordDinoRun(800);
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("Quota exceeded");
    });
    vi.spyOn(window.localStorage, "removeItem").mockImplementation(() => {
      throw new Error("Storage denied");
    });
    await recordDinoRun(600);
    const record = readSealedMemory();
    if (!record) throw new Error("Missing volatile record");
    expect(await openMemory("0600", record)).toContain("bilibili.com");
    await expect(openMemory("0800", record)).rejects.toThrow();
    await recordDinoRun(100);
    expect(readSealedMemory()).toBeNull();
    vi.restoreAllMocks();
    await recordDinoRun(0);
  });
});
