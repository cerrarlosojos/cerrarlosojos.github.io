import {
  act,
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
  within,
} from "../utils/test-utils";
import { vi } from "vitest";
import Terminal from "../components/Terminal";
import { createDinoRunner, DinoSession } from "../games/createDinoRunner";

vi.mock("../games/createDinoRunner", () => ({ createDinoRunner: vi.fn() }));

describe("Hidden dinosaur game", () => {
  let session: DinoSession;
  const command = (value: string) => {
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value } });
    const form = input.closest("form");
    if (!form) throw new Error("Missing terminal form");
    fireEvent.submit(form);
  };

  beforeEach(() => {
    session = { destroy: vi.fn() };
    vi.mocked(createDinoRunner).mockReset().mockResolvedValue(session);
    render(<Terminal />);
  });

  it("hides .Games from ls and reveals it with -a", () => {
    command("ls");
    expect(screen.getByTestId("latest-output")).not.toHaveTextContent(".Games");
    command("ls -a");
    expect(screen.getByTestId("latest-output")).toHaveTextContent(".Games/");
    command("ls -a Blog");
    expect(screen.getByTestId("latest-output")).toHaveTextContent(
      "first-blog.md"
    );
    command("cd .Games");
    command("ls");
    expect(screen.getByTestId("latest-output")).toHaveTextContent("dino");
  });

  it("completes hidden directories only after a dot and completes executables", async () => {
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "cd " } });
    fireEvent.keyDown(input, { key: "Tab" });
    expect(screen.getByTestId("terminal-wrapper")).not.toHaveTextContent(
      ".Games/"
    );
    fireEvent.change(input, { target: { value: "ls -a .g" } });
    fireEvent.keyDown(input, { key: "Tab" });
    expect(input).toHaveValue("ls -a .Games/");
    command("cd .Games");
    fireEvent.change(input, { target: { value: "./di" } });
    fireEvent.keyDown(input, { key: "Tab" });
    expect(input).toHaveValue("./dino");
  });

  it.each([
    "./.Games/dino",
    "~/.Games/dino",
    "/home/cerrarlosojos/.Games/dino",
  ])("launches %s from home and restores input and cwd on Esc", async path => {
    command(path);
    await waitFor(() => expect(createDinoRunner).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("textbox")).toBeDisabled();
    const viewport = screen.getByRole("application", {
      name: "Dinosaur runner",
    });
    fireEvent.keyDown(viewport, { key: "ArrowUp" });
    fireEvent.keyDown(viewport, { key: "ArrowDown" });
    expect(screen.getByRole("textbox")).toHaveValue("");
    fireEvent.keyDown(viewport, { key: "Escape" });
    expect(session.destroy).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("textbox")).toBeEnabled();
    await waitFor(() => expect(screen.getByRole("textbox")).toHaveFocus());
    expect(screen.queryByTestId("dino")).not.toBeInTheDocument();
    expect(screen.queryByText(/Space \/ ↑ jump/)).not.toBeInTheDocument();
    command("pwd");
    expect(screen.getByTestId("latest-output")).toHaveTextContent(
      "/home/cerrarlosojos"
    );
  });

  it("exits with the button, launches a fresh session and clears old game output", async () => {
    command("cd .Games");
    command("./dino");
    await waitFor(() => expect(createDinoRunner).toHaveBeenCalledTimes(1));
    await userEvent.click(screen.getByRole("button", { name: "Exit [Esc]" }));
    expect(session.destroy).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("dino")).not.toBeInTheDocument();
    command("./dino");
    await waitFor(() => expect(createDinoRunner).toHaveBeenCalledTimes(2));
    expect(screen.getAllByTestId("dino")).toHaveLength(1);
    expect(screen.getAllByRole("application")).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Exit [Esc]" }));
    expect(screen.queryByTestId("dino")).not.toBeInTheDocument();
    command("clear");
    expect(screen.queryByTestId("dino")).not.toBeInTheDocument();
    command("ls");
    expect(screen.getByTestId("latest-output")).toHaveTextContent("~/.Games/");
  });

  it("keeps the cube through game over and removes it for a new run or session", async () => {
    command("./.Games/dino");
    await waitFor(() => expect(createDinoRunner).toHaveBeenCalledTimes(1));
    const options = vi.mocked(createDinoRunner).mock.calls[0][1];
    const cube = () =>
      screen.queryByRole("img", { name: "A small black cube" });
    expect(cube()).not.toBeInTheDocument();
    act(() => options.onMemoryCueChange?.(true));
    expect(cube()).toBeInTheDocument();
    act(() => options.onRunEnd?.({ score: 573, endedAt: Date.now() }));
    expect(cube()).toBeInTheDocument();
    act(() => options.onMemoryCueChange?.(false));
    expect(cube()).not.toBeInTheDocument();
    act(() => options.onMemoryCueChange?.(true));
    fireEvent.keyDown(screen.getByRole("application"), { key: "Escape" });
    expect(cube()).not.toBeInTheDocument();
    command("./.Games/dino");
    await waitFor(() => expect(createDinoRunner).toHaveBeenCalledTimes(2));
    expect(cube()).not.toBeInTheDocument();
  });

  it.each(["Escape", "button"])(
    "keeps the last completed score and time after exiting via %s",
    async exit => {
      command("./.Games/dino");
      await waitFor(() => expect(createDinoRunner).toHaveBeenCalledTimes(1));
      const onRunEnd = vi.mocked(createDinoRunner).mock.calls[0][1].onRunEnd;
      const endedAt = new Date("2026-10-03T12:34:56+08:00");
      act(() => {
        onRunEnd?.({ score: 900, endedAt: endedAt.getTime() - 60000 });
        onRunEnd?.({ score: 573, endedAt: endedAt.getTime() });
      });
      expect(screen.queryByTestId("dino-run-summary")).not.toBeInTheDocument();
      if (exit === "Escape") {
        fireEvent.keyDown(screen.getByRole("application"), { key: "Escape" });
      } else {
        await userEvent.click(
          screen.getByRole("button", { name: "Exit [Esc]" })
        );
      }
      const summary = screen.getByTestId("dino-run-summary");
      expect(summary).toHaveTextContent("dino ended · score 00573");
      expect(summary).not.toHaveTextContent("00900");
      expect(summary.querySelector("time")).toHaveAttribute(
        "datetime",
        endedAt.toISOString()
      );
      command("ls Blog");
      expect(summary).toBeInTheDocument();

      // A new session exited before a crash does not invent or reuse a score.
      command("./.Games/dino");
      await waitFor(() => expect(createDinoRunner).toHaveBeenCalledTimes(2));
      fireEvent.keyDown(screen.getByRole("application"), { key: "Escape" });
      expect(screen.getAllByTestId("dino-run-summary")).toHaveLength(1);
      command("clear");
      expect(screen.queryByTestId("dino-run-summary")).not.toBeInTheDocument();
    }
  );

  it("disposes a session that finishes loading after the user has exited", async () => {
    let resolve: (session: DinoSession) => void = () => undefined;
    vi.mocked(createDinoRunner).mockImplementationOnce(
      () =>
        new Promise<DinoSession | null>(done => {
          resolve = done;
        })
    );
    command("./.Games/dino");
    await waitFor(() => expect(createDinoRunner).toHaveBeenCalledTimes(1));
    fireEvent.keyDown(screen.getByRole("application"), { key: "Escape" });
    expect(vi.mocked(createDinoRunner).mock.calls[0][1].signal.aborted).toBe(
      true
    );
    await act(async () => resolve(session));
    expect(session.destroy).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("textbox")).toBeEnabled();
    expect(screen.queryByRole("application")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dino")).not.toBeInTheDocument();
  });

  it("allows exiting after an asset loading failure", async () => {
    vi.mocked(createDinoRunner).mockRejectedValueOnce(
      new Error("Missing sprite")
    );
    command("./.Games/dino");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load the game"
    );
    await userEvent.click(screen.getByRole("button", { name: "Exit [Esc]" }));
    expect(screen.getByRole("textbox")).toBeEnabled();
  });

  it("rejects game arguments and paths that are not executable", () => {
    command("./dino");
    expect(screen.getByTestId("not-found-0")).toHaveTextContent(
      "command not found"
    );
    command("./.Games/dino extra");
    expect(screen.getByTestId("terminal-wrapper")).toHaveTextContent(
      "Usage: ./.Games/dino"
    );
    expect(screen.getByRole("textbox")).toBeEnabled();
    expect(createDinoRunner).not.toHaveBeenCalled();
    command("ls -x");
    expect(
      within(screen.getByTestId("latest-output")).getByText(
        "Usage: ls [-a] [-l] [path]"
      )
    ).toBeInTheDocument();
  });
});
