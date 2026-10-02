import { useEffect, useId, useRef, useState } from "react";
import {
  openMemory,
  readSealedMemory,
  subscribeMemory,
} from "../games/dinoMemory";
import { HelpPanel, PanelTitle } from "./styles/Help.styled";
import {
  CubeLink,
  LockForm,
  MemoryHint,
  MemoryScene,
} from "./styles/EncryptedMemory.styled";

const EncryptedMemory: React.FC<{ path: string; autoFocus: boolean }> = ({
  path,
  autoFocus,
}) => {
  const passwordId = useId();
  const [record, setRecord] = useState(readSealedMemory);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const passwordRef = useRef<HTMLInputElement>(null);
  const cubeRef = useRef<HTMLAnchorElement>(null);
  const request = useRef(0);

  useEffect(() => {
    const unsubscribe = subscribeMemory(() => {
      request.current++;
      const next = readSealedMemory();
      setRecord(next);
      setPassword("");
      setUrl("");
      setMessage("");
      setBusy(false);
    });
    return () => {
      request.current++;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!autoFocus) return;
    if (url) cubeRef.current?.focus();
    else if (!busy) passwordRef.current?.focus();
  }, [autoFocus, url, busy]);

  const unlock = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!record || !/^\d{4}$/.test(password)) {
      setMessage("That memory doesn't belong here.");
      setPassword("");
      return;
    }
    const attempt = ++request.current;
    setBusy(true);
    setMessage("");
    try {
      const destination = await openMemory(password, record);
      if (attempt !== request.current) return;
      setUrl(destination);
      setPassword("");
    } catch {
      if (attempt === request.current) {
        setMessage("That memory doesn't belong here.");
        setPassword("");
      }
    } finally {
      if (attempt === request.current) setBusy(false);
    }
  };

  return (
    <HelpPanel data-testid="encrypted-memory" data-terminal-interactive>
      <PanelTitle>{path}</PanelTitle>
      {!url && (
        <>
          <MemoryHint>
            The last thing you remember may be the first thing you need.
          </MemoryHint>
          <LockForm onSubmit={unlock} noValidate>
            <label htmlFor={passwordId}>Key</label>
            <input
              ref={passwordRef}
              id={passwordId}
              aria-label="Memory password"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              pattern="[0-9]{4}"
              required
              disabled={busy}
              value={password}
              onChange={event => setPassword(event.target.value)}
            />
            <button disabled={busy} type="submit">
              {busy ? "Opening…" : "Unlock"}
            </button>
          </LockForm>
          {message && <MemoryHint role="alert">{message}</MemoryHint>}
        </>
      )}
      {url && (
        <MemoryScene role="region" aria-label="Decrypted memory">
          <CubeLink
            ref={cubeRef}
            href={url}
            target="_blank"
            rel="noreferrer"
            aria-label="Open the hidden memory"
          >
            <span className="levitation" aria-hidden="true">
              <span className="cube">
                {["front", "back", "right", "left", "top", "bottom"].map(
                  face => (
                    <span key={face} className={`face ${face}`} />
                  )
                )}
              </span>
            </span>
          </CubeLink>
        </MemoryScene>
      )}
    </HelpPanel>
  );
};

export default EncryptedMemory;
