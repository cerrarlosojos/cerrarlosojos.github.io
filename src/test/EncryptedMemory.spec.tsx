import { webcrypto } from "node:crypto";
import { vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "../utils/test-utils";
import Terminal from "../components/Terminal";
import { recordDinoRun } from "../games/dinoMemory";

const command = (value: string) => {
  const input = screen.getByTitle("terminal-input");
  fireEvent.change(input, { target: { value } });
  const form = input.closest("form");
  if (!form) throw new Error("Missing terminal form");
  fireEvent.submit(form);
};

describe("Hidden encrypted file", () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });
    vi.stubGlobal("crypto", webcrypto);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("hides dotfiles from ls and completion until explicitly requested", () => {
    render(<Terminal />);
    command("ls Blog");
    expect(screen.getByTestId("latest-output")).not.toHaveTextContent(
      ".dejavu.txt"
    );
    command("ls -a Blog");
    expect(screen.getByTestId("latest-output")).toHaveTextContent(
      ".dejavu.txt"
    );
    command("cd Blog");
    const input = screen.getByTitle("terminal-input");
    fireEvent.change(input, { target: { value: "cat " } });
    fireEvent.keyDown(input, { key: "Tab" });
    expect(input).toHaveValue("cat first-blog.md");
    fireEvent.change(input, { target: { value: "cat .d" } });
    fireEvent.keyDown(input, { key: "Tab" });
    expect(input).toHaveValue("cat .dejavu.txt");
  });

  it("offers only a cryptic prompt and cannot unlock before a qualifying completed run", async () => {
    render(<Terminal />);
    command("cat Blog/.dejavu.txt");
    const panel = await screen.findByTestId("encrypted-memory");
    expect(panel).toHaveTextContent(
      "The last thing you remember may be the first thing you need."
    );
    expect(panel).not.toHaveTextContent(/500|four|digits|score|dino|zeros/i);
    const input = screen.getByLabelText("Memory password");
    fireEvent.change(input, { target: { value: "0512" } });
    const form = input.closest("form");
    if (!form) throw new Error("Missing password form");
    fireEvent.submit(form);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "That memory doesn't belong here."
    );
    expect(
      screen.queryByRole("link", { name: "Open the hidden memory" })
    ).not.toBeInTheDocument();
  });

  it("rejects a wrong password, keeps input focus, then reveals only the decrypted link", async () => {
    await recordDinoRun(512);
    const { unmount } = render(<Terminal />);
    command("cat Blog/.dejavu.txt");
    const input = await screen.findByLabelText("Memory password");
    expect(screen.getByTestId("encrypted-memory")).not.toHaveTextContent(
      /500|four|digits|score|dino|zeros/i
    );
    await waitFor(() => expect(input).toHaveFocus());
    fireEvent.click(input);
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: "0513" } });
    const form = input.closest("form");
    if (!form) throw new Error("Missing password form");
    fireEvent.submit(form);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "doesn't belong"
    );
    expect(
      screen.queryByRole("link", { name: "Open the hidden memory" })
    ).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: "0512" } });
    fireEvent.submit(form);
    const link = await screen.findByRole("link", {
      name: "Open the hidden memory",
    });
    expect(
      screen.queryByRole("status", { name: "Decrypting memory" })
    ).not.toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "https://www.bilibili.com/video/BV1PK4y1B76J/"
    );
    expect(link).toHaveFocus();
    command("ls Blog");
    expect(
      within(screen.getByTestId("latest-output")).getByText("first-blog.md")
    ).toBeInTheDocument();
    unmount();
  });

  it("relocks an already open file when the next completed run is below the threshold", async () => {
    await recordDinoRun(650);
    render(<Terminal />);
    command("cat Blog/.dejavu.txt");
    await screen.findByLabelText("Memory password");
    await act(async () => {
      await recordDinoRun(100);
    });
    const input = screen.getByLabelText("Memory password");
    fireEvent.change(input, { target: { value: "0650" } });
    const form = input.closest("form");
    if (!form) throw new Error("Missing password form");
    fireEvent.submit(form);
    expect(screen.getByRole("alert")).toHaveTextContent("doesn't belong here");
    expect(
      screen.queryByRole("link", { name: "Open the hidden memory" })
    ).not.toBeInTheDocument();
  });

  it("does not steal focus from a newer command when a historical memory relocks", async () => {
    await recordDinoRun(650);
    render(<Terminal />);
    command("cat Blog/.dejavu.txt");
    const input = await screen.findByLabelText("Memory password");
    fireEvent.change(input, { target: { value: "0650" } });
    const form = input.closest("form");
    if (!form) throw new Error("Missing memory form");
    fireEvent.submit(form);
    await screen.findByRole("link", { name: "Open the hidden memory" });
    command("echo new command");
    const terminalInput = screen.getByTitle("terminal-input");
    terminalInput.focus();
    await act(async () => {
      await recordDinoRun(100);
    });
    expect(terminalInput).toHaveFocus();
    expect(screen.getByLabelText("Memory password")).toBeInTheDocument();
  });
});
