import { webcrypto } from "node:crypto";
import { vi } from "vitest";
import { act, fireEvent, render, screen, within } from "../utils/test-utils";
import Terminal from "../components/Terminal";
import { recordDinoRun } from "../games/dinoMemory";

const command = (value: string) => {
  const input = screen.getByTitle("terminal-input");
  fireEvent.change(input, { target: { value } });
  const form = input.closest("form");
  if (!form) throw new Error("Missing terminal form");
  fireEvent.submit(form);
};

describe("Long file listings", () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });
    vi.stubGlobal("crypto", webcrypto);
    render(<Terminal />);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("keeps hidden files hidden in long format and distinguishes executables", () => {
    command("ls -l Blog");
    const listing = screen.getByTestId("latest-output");
    expect(listing).toHaveTextContent("first-blog.md");
    expect(listing).not.toHaveTextContent(".dejavu.txt");
    const row = within(listing).getByRole("row", { name: /first-blog.md/ });
    const cells = within(row).getAllByRole("cell");
    expect(cells[0]).toHaveTextContent("-r--r--r--");
    expect(cells[2]).toHaveTextContent("cerrarlosojos");
    expect(Number(cells[4].textContent)).toBeGreaterThan(0);
    expect(cells[5]).toHaveTextContent("—");

    command("ls -l .Games/dino");
    expect(screen.getByTestId("latest-output")).toHaveTextContent("-r-xr-xr-x");
    command("ls -l");
    expect(screen.getByTestId("latest-output")).toHaveTextContent("dr-xr-xr-x");
    expect(screen.getByTestId("latest-output")).not.toHaveTextContent(".Games");
  });

  it.each(["-a -l", "-l -a"])(
    "accepts separate hidden and long-listing flags: %s",
    flags => {
      command(`ls ${flags} Blog`);
      const listing = screen.getByTestId("latest-output");
      expect(within(listing).getByRole("table")).toBeInTheDocument();
      expect(listing).toHaveTextContent("first-blog.md");
      expect(listing).toHaveTextContent(".dejavu.txt");
    }
  );

  it("accepts explicit hidden files and preserves external file links", () => {
    command("ls -l -- Blog/.dejavu.txt");
    expect(screen.getByTestId("latest-output")).toHaveTextContent(
      ".dejavu.txt"
    );
    command("ls -l Publications/cstar.pdf");
    const listing = screen.getByTestId("latest-output");
    expect(
      within(listing).getByRole("link", { name: "cstar.pdf" })
    ).toHaveAttribute("href", "https://arxiv.org/pdf/2504.02246");
    expect(within(listing).getAllByRole("cell")[4]).toHaveTextContent("—");
  });

  it("records memory timestamps without rewriting historical output", async () => {
    command("ls -l Blog/.dejavu.txt");
    const emptyListing = screen.getByTestId("latest-output");
    const emptyText = emptyListing.textContent;
    const firstTime = new Date("2026-10-03T12:34:56+08:00");
    await act(() => recordDinoRun(573, firstTime.getTime()));
    command("ls -a -l Blog");
    const firstListing = screen.getByTestId("latest-output");
    expect(firstListing.querySelector("time")).toHaveAttribute(
      "datetime",
      firstTime.toISOString()
    );
    expect(emptyListing.textContent).toBe(emptyText);

    const secondTime = new Date("2026-10-03T12:45:01+08:00");
    await act(() => recordDinoRun(680, secondTime.getTime()));
    command("ls -l Blog/.dejavu.txt");
    expect(
      screen.getByTestId("latest-output").querySelector("time")
    ).toHaveAttribute("datetime", secondTime.toISOString());
    expect(firstListing.querySelector("time")).toHaveAttribute(
      "datetime",
      firstTime.toISOString()
    );
  });

  it.each(["-al", "-la", "-lx", "-L", "-l Blog Publications"])(
    "rejects unsupported arguments: %s",
    args => {
      command(`ls ${args}`);
      expect(screen.getByTestId("ls-invalid-arg")).toHaveTextContent(
        "Usage: ls [-a] [-l] [path]"
      );
    }
  );

  it("completes file paths after long-listing flags", () => {
    const input = screen.getByTitle("terminal-input");
    fireEvent.change(input, { target: { value: "ls -l Blog/fi" } });
    fireEvent.keyDown(input, { key: "Tab" });
    expect(input).toHaveValue("ls -l Blog/first-blog.md");
  });
});
