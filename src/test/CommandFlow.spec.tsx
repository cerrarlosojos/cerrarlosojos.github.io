import { StrictMode } from "react";
import { vi } from "vitest";
import { fireEvent, render, screen, userEvent } from "../utils/test-utils";
import Terminal from "../components/Terminal";
import { themeContext } from "../components/ThemeContext";
import themes from "../components/styles/themes";

const submit = (command: string) => {
  const input = screen.getByTitle("terminal-input");
  fireEvent.change(input, { target: { value: command } });
  const form = input.closest("form");
  if (!form) throw new Error("Missing terminal form");
  fireEvent.submit(form);
};

describe("Command submission and historical output", () => {
  it("allows editing in the middle of the input without moving the caret", async () => {
    const user = userEvent.setup();
    render(<Terminal />);
    const input = screen.getByTitle("terminal-input") as HTMLInputElement;
    await user.type(input, "echo abc");
    input.setSelectionRange(5, 5);
    await user.keyboard("XY");
    expect(input).toHaveValue("echo XYabc");
  });
  it("executes each theme change once, including irregular whitespace, in StrictMode", () => {
    const switchTheme = vi.fn();
    render(
      <StrictMode>
        <themeContext.Provider value={switchTheme}>
          <Terminal />
        </themeContext.Provider>
      </StrictMode>
    );
    submit("themes");
    submit("  themes\tset   light  ");
    expect(switchTheme).toHaveBeenCalledTimes(1);
    expect(switchTheme).toHaveBeenCalledWith(themes.light);
    submit("themes set ubuntu");
    expect(switchTheme).toHaveBeenCalledTimes(2);
    expect(switchTheme).toHaveBeenLastCalledWith(themes.ubuntu);
    submit("echo hello");
    fireEvent.change(screen.getByTitle("terminal-input"), {
      target: { value: "more typing" },
    });
    expect(switchTheme).toHaveBeenCalledTimes(2);
    // Only the original theme list has its standard usage example.
    expect(screen.getAllByTestId("themes-invalid-arg")).toHaveLength(1);
    submit("themes set __proto__");
    expect(switchTheme).toHaveBeenCalledTimes(2);
    expect(screen.getAllByTestId("themes-invalid-arg")).toHaveLength(2);
  });

  it("uses the same whitespace parsing and original directory for execution and output", () => {
    render(<Terminal />);
    submit("cd\t Blog");
    submit("ls\t-a");
    expect(screen.getByTestId("latest-output")).toHaveTextContent(
      "first-blog.md"
    );
    expect(screen.getByTestId("latest-output")).toHaveTextContent(
      ".dejavu.txt"
    );
    submit("cd ../Publications");
    expect(screen.getByTestId("ls")).toHaveTextContent("~/Blog/");
    submit("cd ../Blog/first-blog.md/..");
    expect(screen.getByTestId("cd-invalid-arg")).toBeInTheDocument();
    submit("pwd");
    expect(screen.getByTestId("latest-output")).toHaveTextContent(
      "/home/cerrarlosojos/Publications"
    );
  });

  it("completes theme and file arguments with multiple spaces without duplicating tokens", () => {
    render(<Terminal />);
    const input = screen.getByTitle("terminal-input");
    for (const [value, expected] of [
      ["themes   s", "themes   set"],
      ["themes   set  ub", "themes   set  ubuntu"],
      ["glow   Blog/fi", "glow   Blog/first-blog.md"],
    ]) {
      fireEvent.change(input, { target: { value } });
      fireEvent.keyDown(input, { key: "Tab" });
      expect(input).toHaveValue(expected);
    }
  });
});
