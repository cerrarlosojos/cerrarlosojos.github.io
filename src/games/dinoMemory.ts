import { getFromLS, setToLS } from "../utils/storage";

// The destination is the only setting needed to move the hidden memory later.
const destination = "https://www.bilibili.com/video/BV1PK4y1B76J/";
const storageKey = "terminal-dino-encrypted-memory";
const changeEvent = "terminal-memory-change";
type SealedMemory = {
  version: 1;
  salt: string;
  iv: string;
  ciphertext: string;
};
let revision = 0;
// undefined means storage is authoritative; null is an explicit volatile lock.
let volatileMemory: SealedMemory | null | undefined;

const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const decode = (value: string) =>
  Uint8Array.from(atob(value), character => character.charCodeAt(0));

const writeMemory = (memory: SealedMemory | null) => {
  volatileMemory = setToLS(storageKey, memory ? JSON.stringify(memory) : null)
    ? undefined
    : memory;
  window.dispatchEvent(new Event(changeEvent));
};

export const readSealedMemory = (): SealedMemory | null => {
  if (volatileMemory !== undefined) return volatileMemory;
  try {
    const raw = getFromLS(storageKey);
    if (!raw) return null;
    const record = JSON.parse(raw);
    if (
      !record ||
      record.version !== 1 ||
      typeof record.salt !== "string" ||
      typeof record.iv !== "string" ||
      typeof record.ciphertext !== "string" ||
      record.salt.length !== 24 ||
      record.iv.length !== 16 ||
      record.ciphertext.length > 2048 ||
      decode(record.salt).length !== 16 ||
      decode(record.iv).length !== 12 ||
      decode(record.ciphertext).length < 16
    )
      return null;
    return record;
  } catch {
    return null;
  }
};

export const subscribeMemory = (notify: () => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) {
      revision++;
      volatileMemory = undefined;
      notify();
    }
  };
  window.addEventListener(changeEvent, notify);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(changeEvent, notify);
    window.removeEventListener("storage", onStorage);
  };
};

const deriveKey = async (password: string, salt: Uint8Array) => {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new Uint8Array(salt),
      iterations: 60000,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

// A completed run replaces the previous key, even when its score is too low.
// A pending encryption must never overwrite a newer run.
export const recordDinoRun = async (score: number): Promise<boolean> => {
  const run = ++revision;
  writeMemory(null);
  if (!Number.isSafeInteger(score) || score <= 500) return false;
  try {
    const password = String(score % 10000).padStart(4, "0");
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(destination)
    );
    if (run !== revision) return false;
    writeMemory({
      version: 1,
      salt: encode(salt),
      iv: encode(iv),
      ciphertext: encode(new Uint8Array(ciphertext)),
    });
    return true;
  } catch {
    return false;
  }
};

export const openMemory = async (password: string, record: SealedMemory) => {
  if (!/^\d{4}$/.test(password)) throw new Error("Four digits required");
  const key = await deriveKey(password, decode(record.salt));
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: decode(record.iv) },
    key,
    decode(record.ciphertext)
  );
  const url = new TextDecoder().decode(plaintext);
  if (new URL(url).protocol !== "https:")
    throw new Error("Invalid destination");
  return url;
};
