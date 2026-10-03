import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent, within } from "../utils/test-utils";
import Terminal from "../components/Terminal";
import { commands } from "../data/commands";

// setup function
function setup(jsx: JSX.Element) {
  return {
    user: userEvent.setup(),
    ...render(jsx),
  };
}

const allCmds = commands.map(cmdObj => cmdObj.cmd);

describe("Terminal Component", () => {
  let terminalInput: HTMLInputElement;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    const termSetup = setup(<Terminal />);
    user = termSetup.user;
    terminalInput = screen.getByTitle("terminal-input");
  });

  describe("Input Features & Initial State", () => {
    it("should display welcome cmd by default", () => {
      expect(screen.getByTestId("input-command").textContent).toBe("welcome");
    });

    it("should change input value", async () => {
      await user.type(terminalInput, "demo");
      expect(terminalInput.value).toBe("demo");
    });

    it("should clear input value when click enter", async () => {
      await user.type(terminalInput, "demo{enter}");
      expect(terminalInput.value).toBe("");
    });
  });

  describe("Input Commands", () => {
    it("should return 'command not found' when input value is invalid", async () => {
      await user.type(terminalInput, "demo{enter}");
      expect(screen.getByTestId("not-found-0").innerHTML).toBe(
        "command not found: demo"
      );
    });

    it("should return 'visitor' when user type 'whoami' cmd", async () => {
      await user.type(terminalInput, "whoami{enter}");
      expect(screen.getByTestId("latest-output").firstChild?.textContent).toBe(
        "visitor"
      );
    });

    it("should return '/home/cerrarlosojos' when user type 'pwd' cmd", async () => {
      await user.type(terminalInput, "pwd{enter}");
      expect(screen.getByTestId("latest-output").firstChild?.textContent).toBe(
        "/home/cerrarlosojos"
      );
    });

    it("should clear everything when user type 'clear' cmd", async () => {
      await user.type(terminalInput, "clear{enter}");
      expect(screen.getByTestId("terminal-wrapper").children.length).toBe(1);
    });

    it("should return `hello world` when user type `echo hello world` cmd", async () => {
      await user.type(terminalInput, "echo hello world{enter}");
      expect(screen.getByTestId("latest-output").firstChild?.textContent).toBe(
        "hello world"
      );
    });

    it("should return `hello world` without quotes when user type `echo 'hello world'` cmd", async () => {
      // omit single quotes
      await user.type(terminalInput, "echo 'hello world'{enter}");
      expect(screen.getByTestId("latest-output").firstChild?.textContent).toBe(
        "hello world"
      );

      // omit double quotes
      await user.type(terminalInput, 'echo "hello world"{enter}');
      expect(screen.getByTestId("latest-output").firstChild?.textContent).toBe(
        "hello world"
      );

      // omit backtick
      await user.type(terminalInput, "echo `hello world`{enter}");
      expect(screen.getByTestId("latest-output").firstChild?.textContent).toBe(
        "hello world"
      );
    });

    it("should render Welcome component when user type 'welcome' cmd", async () => {
      await user.type(terminalInput, "clear{enter}");
      await user.type(terminalInput, "welcome{enter}");
      expect(screen.getByTestId("welcome")).toBeInTheDocument();
    });

    const otherCmds = [
      "about",
      "education",
      "help",
      "ls",
      "projects",
      "socials",
      "teaching",
      "themes",
    ];
    otherCmds.forEach(cmd => {
      it(`should render ${cmd} component when user type '${cmd}' cmd`, async () => {
        await user.type(terminalInput, `${cmd}{enter}`);
        expect(screen.getByTestId(`${cmd}`)).toBeInTheDocument();
      });
    });
  });

  describe("Homepage directories", () => {
    it("lists only Publications and Blog at home", async () => {
      await user.type(terminalInput, "ls{enter}");
      const output = screen.getByTestId("latest-output");
      expect(
        Array.from(output.querySelectorAll("dt"), entry => entry.textContent)
      ).toEqual(["Publications/", "Blog/"]);
    });

    it("lists only cstar.pdf with its PDF link on the left and title on the right", async () => {
      await user.type(terminalInput, "ls Publications{enter}");
      const output = screen.getByTestId("latest-output");
      const filenames = output.querySelectorAll("dt");
      expect(filenames).toHaveLength(1);
      expect(filenames[0]).toHaveTextContent("cstar.pdf");
      expect(
        within(filenames[0]).getByRole("link", { name: "cstar.pdf" })
      ).toHaveAttribute("href", "https://arxiv.org/pdf/2504.02246");
      expect(within(output).queryByText("arXiv PDF")).not.toBeInTheDocument();
      expect(output.querySelector("dd")).toHaveTextContent(
        "C★: Unifying Programming and Verification in C"
      );
    });

    it("lists only the original Markdown blog and a one-sentence summary", async () => {
      await user.type(terminalInput, "ls Blog{enter}");
      const output = screen.getByTestId("latest-output");
      expect(
        Array.from(output.querySelectorAll("dt"), entry => entry.textContent)
      ).toEqual(["first-blog.md"]);
      expect(output.querySelector("dd")?.textContent).toBe(
        "A Hello World opening post (2025-11-30)"
      );
    });

    it("accepts home-relative paths and case-insensitive folder names", async () => {
      for (const path of ["./blog/", "~/Blog/", "/home/cerrarlosojos/Blog/"]) {
        await user.type(terminalInput, `ls ${path}{enter}`);
        expect(
          within(screen.getByTestId("latest-output")).getByText("~/Blog/")
        ).toBeInTheDocument();
      }
    });

    it.each(["Unknown", "Publications/secret", "/etc"])(
      "reports an unavailable directory: %s",
      async path => {
        await user.type(terminalInput, `ls ${path}{enter}`);
        expect(screen.getByTestId("ls-invalid-arg")).toHaveTextContent(
          `ls: cannot access '${path}': No such file or directory`
        );
      }
    );

    it.each(["PL", "Tennis", "Movies", "Music", "Cheers"])(
      "rejects the retired %s directory",
      async path => {
        await user.type(terminalInput, `ls ${path}{enter}`);
        expect(screen.getByTestId("ls-invalid-arg")).toHaveTextContent(
          `ls: cannot access '${path}': No such file or directory`
        );
      }
    );

    it("shows usage when more than one directory is supplied", async () => {
      await user.type(terminalInput, "ls Publications Blog{enter}");
      expect(screen.getByTestId("ls-invalid-arg")).toHaveTextContent(
        "Usage: ls [-a] [-l] [path]"
      );
    });

    it("completes a directory without duplicating the partial argument", async () => {
      await user.type(terminalInput, "ls ~/pub");
      await user.tab();
      expect(terminalInput.value).toBe("ls ~/Publications/");
      await user.keyboard("{enter}");
      expect(
        within(screen.getByTestId("latest-output")).getByText("cstar.pdf")
      ).toBeInTheDocument();
    });

    it("offers both directories for an empty path", async () => {
      await user.type(terminalInput, "ls ");
      await user.tab();
      expect(terminalInput.value).toBe("ls ");
      expect(screen.getByText("Publications/")).toBeInTheDocument();
      expect(screen.getByText("Blog/")).toBeInTheDocument();
    });
  });

  describe("Directory navigation", () => {
    const prompt = () => terminalInput.labels?.[0]?.textContent;

    it.each(["Publications", "Blog"])(
      "enters %s and updates pwd and the prompt",
      async directory => {
        await user.type(terminalInput, `cd ${directory}{enter}`);
        expect(screen.getByTestId("latest-output")).toBeEmptyDOMElement();
        expect(prompt()).toContain(`~/${directory}$`);
        await user.type(terminalInput, "pwd{enter}");
        expect(screen.getByTestId("latest-output")).toHaveTextContent(
          `/home/cerrarlosojos/${directory}`
        );
      }
    );

    it("lists the current directory and keeps old outputs and prompts intact", async () => {
      await user.type(
        terminalInput,
        "pwd{enter}ls{enter}cd Blog{enter}ls{enter}"
      );
      const listings = screen.getAllByTestId("ls");
      expect(
        within(listings[0]).getByText("first-blog.md")
      ).toBeInTheDocument();
      expect(
        within(listings[1]).getByText("Publications/")
      ).toBeInTheDocument();
      expect(
        screen.getByText("/home/cerrarlosojos", { exact: true })
      ).toBeInTheDocument();
      const cdPrompt = screen
        .getAllByTestId("input-command")
        .find(element => element.textContent === "cd Blog")?.parentElement;
      expect(cdPrompt?.firstElementChild).toHaveTextContent(
        "visitor@cerrarlosojos:~$"
      );
      expect(prompt()).toContain("~/Blog$");
    });

    it("resolves parent paths and ls paths relative to the current directory", async () => {
      await user.type(
        terminalInput,
        "cd Blog{enter}cd ../Publications{enter}ls ../Blog{enter}"
      );
      expect(prompt()).toContain("~/Publications$");
      expect(
        within(screen.getByTestId("latest-output")).getByText("first-blog.md")
      ).toBeInTheDocument();
      await user.type(
        terminalInput,
        "cd ./../blog/.{enter}cd .{enter}pwd{enter}"
      );
      expect(screen.getByTestId("latest-output")).toHaveTextContent(
        "/home/cerrarlosojos/Blog"
      );
    });

    it("lists Blog after clearing and a failed repeated relative cd", async () => {
      await user.type(
        terminalInput,
        "cd Blog{enter}clear{enter}cd Blog{enter}ls{enter}"
      );
      const output = screen.getByTestId("latest-output");
      expect(prompt()).toContain("~/Blog$");
      expect(screen.getByTestId("cd-invalid-arg")).toHaveTextContent(
        "cd: Blog: No such directory"
      );
      expect(
        Array.from(output.querySelectorAll("dt"), entry => entry.textContent)
      ).toEqual(["first-blog.md"]);
      expect(within(output).getByText("~/Blog/")).toBeInTheDocument();
      expect(
        within(output).queryByText("Publications/")
      ).not.toBeInTheDocument();
    });

    it.each(["cd", "cd ~", "cd ..", "cd /home/cerrarlosojos"])(
      "returns home with %s without replaying old cd commands",
      async command => {
        await user.type(
          terminalInput,
          `cd Blog{enter}${command}{enter}echo hello{enter}pwd{enter}`
        );
        expect(screen.getByTestId("latest-output").textContent).toBe(
          "/home/cerrarlosojos"
        );
        expect(prompt()).toContain(":~$");
      }
    );

    it("supports home paths from inside another directory", async () => {
      await user.type(
        terminalInput,
        "cd Blog{enter}cd ~/Publications/{enter}cd /home/cerrarlosojos/Blog/{enter}pwd{enter}"
      );
      expect(screen.getByTestId("latest-output")).toHaveTextContent(
        "/home/cerrarlosojos/Blog"
      );
      await user.type(terminalInput, "ls ~{enter}");
      expect(
        within(screen.getByTestId("latest-output")).getByText("Publications/")
      ).toBeInTheDocument();
      expect(prompt()).toContain("~/Blog$");
    });

    it.each(["Missing", "first-blog.md", "/etc", "../Missing/../Publications"])(
      "keeps the current directory when cd %s fails",
      async path => {
        await user.type(terminalInput, `cd Blog{enter}cd ${path}{enter}`);
        expect(screen.getByTestId("cd-invalid-arg")).toHaveTextContent(
          `cd: ${path}: No such directory`
        );
        expect(prompt()).toContain("~/Blog$");
        await user.type(terminalInput, "pwd{enter}");
        expect(screen.getByTestId("latest-output")).toHaveTextContent(
          "/home/cerrarlosojos/Blog"
        );
      }
    );

    it("rejects extra arguments without changing the directory", async () => {
      await user.type(
        terminalInput,
        "cd Blog{enter}cd Publications Blog{enter}"
      );
      expect(screen.getByTestId("cd-invalid-arg")).toHaveTextContent(
        "Usage: cd [directory]"
      );
      expect(prompt()).toContain("~/Blog$");
    });

    it("preserves the current directory after clearing the terminal", async () => {
      await user.type(terminalInput, "cd Blog{enter}clear{enter}");
      expect(screen.getByTestId("terminal-wrapper").children).toHaveLength(1);
      expect(prompt()).toContain("~/Blog$");
      await user.type(terminalInput, "pwd{enter}");
      expect(screen.getByTestId("latest-output")).toHaveTextContent(
        "/home/cerrarlosojos/Blog"
      );
    });

    it("moves from home to /home and /, stopping only at the root", async () => {
      await user.type(terminalInput, "cd ..{enter}pwd{enter}");
      expect(screen.getByTestId("latest-output").textContent).toBe("/home");
      expect(prompt()).toContain(":/home$");
      await user.type(terminalInput, "ls{enter}");
      expect(screen.getByTestId("latest-output")).toHaveTextContent(
        "cerrarlosojos/"
      );
      expect(screen.getByTestId("latest-output")).not.toHaveTextContent(
        "Blog/"
      );
      await user.type(terminalInput, "cd ..{enter}pwd{enter}");
      expect(screen.getByTestId("latest-output").textContent).toBe("/");
      expect(prompt()).toContain(":/$");
      await user.type(terminalInput, "ls{enter}");
      expect(screen.getByTestId("latest-output")).toHaveTextContent("home/");
      await user.type(terminalInput, "cd ../../{enter}pwd{enter}");
      expect(screen.getByTestId("latest-output").textContent).toBe("/");
    });

    it("navigates back through the parent hierarchy and retains file access", async () => {
      await user.type(
        terminalInput,
        "cd ../../{enter}cd home/cerrarlosojos/Blog{enter}cat first-blog.md{enter}"
      );
      expect(screen.getByTestId("latest-output")).toHaveTextContent(
        "Hello World!"
      );
      expect(prompt()).toContain("~/Blog$");
      await user.type(
        terminalInput,
        "cd /home{enter}ls cerrarlosojos/Publications{enter}"
      );
      expect(screen.getByTestId("latest-output")).toHaveTextContent(
        "cstar.pdf"
      );
      expect(prompt()).toContain(":/home$");
      await user.type(terminalInput, "cd ~{enter}pwd{enter}");
      expect(screen.getByTestId("latest-output").textContent).toBe(
        "/home/cerrarlosojos"
      );
      expect(prompt()).toContain(":~$");
    });

    it("completes parent directory entries using their actual children", async () => {
      await user.type(terminalInput, "cd ..{enter}cd cer");
      await user.tab();
      expect(terminalInput.value).toBe("cd cerrarlosojos/");
      await user.keyboard("{enter}");
      expect(prompt()).toContain(":~$");
      await user.type(terminalInput, "cd /{enter}ls h");
      await user.tab();
      expect(terminalInput.value).toBe("ls home/");
      await user.keyboard("{enter}");
      expect(screen.getByTestId("latest-output")).toHaveTextContent(
        "cerrarlosojos/"
      );
    });

    it("completes cd and ls paths relative to the current directory", async () => {
      await user.type(terminalInput, "cd Blog{enter}cd ../pub");
      await user.tab();
      expect(terminalInput.value).toBe("cd ../Publications/");
      await user.keyboard("{enter}");
      expect(prompt()).toContain("~/Publications$");
      await user.type(terminalInput, "ls ../b");
      await user.tab();
      expect(terminalInput.value).toBe("ls ../Blog/");
      await user.keyboard("{enter}");
      expect(
        within(screen.getByTestId("latest-output")).getByText("first-blog.md")
      ).toBeInTheDocument();
      expect(prompt()).toContain("~/Publications$");
    });
  });

  describe("File reading", () => {
    it("reads Markdown source with cat in the current folder", async () => {
      await user.type(terminalInput, "cd Blog{enter}cat first-blog.md{enter}");
      const output = screen.getByTestId("latest-output");
      expect(
        within(output).getByText("~/Blog/first-blog.md")
      ).toBeInTheDocument();
      expect(output.querySelector("pre")?.textContent).toContain(
        'title: "First Blog"\ndate: 2025-11-30\ntags:\n  - Hello World'
      );
      expect(output.querySelector("pre")).toHaveTextContent("Hello World!");
      expect(within(output).queryByRole("heading")).not.toBeInTheDocument();
      expect(output).not.toHaveTextContent("Usage:");
      expect(output).not.toHaveTextContent("with no body text yet");
      expect(terminalInput.labels?.[0]?.textContent).toContain("~/Blog$");
    });

    it("previews the blog with glow while hiding Markdown source", async () => {
      await user.type(terminalInput, "cd Blog{enter}glow first-blog.md{enter}");
      const output = screen.getByTestId("latest-output");
      expect(
        await within(output).findByRole("heading", {
          name: "First Blog",
          level: 1,
        })
      ).toBeInTheDocument();
      expect(output.querySelector("time")).toHaveAttribute(
        "datetime",
        "2025-11-30"
      );
      expect(output.querySelector("article p")).toHaveTextContent(
        "Hello World!"
      );
      expect(output).toHaveTextContent("Hello World");
      expect(output).not.toHaveTextContent("title:");
      expect(output).not.toHaveTextContent("tags:");
      expect(output.querySelector("pre")).not.toBeInTheDocument();
      expect(terminalInput.labels?.[0]?.textContent).toContain("~/Blog$");
    });

    it("completes glow paths and reads the preview from home", async () => {
      await user.type(terminalInput, "glow Bl");
      await user.tab();
      expect(terminalInput.value).toBe("glow Blog/");
      await user.type(terminalInput, "fi");
      await user.tab();
      expect(terminalInput.value).toBe("glow Blog/first-blog.md");
      await user.keyboard("{enter}");
      expect(
        await within(screen.getByTestId("latest-output")).findByRole(
          "heading",
          {
            name: "First Blog",
          }
        )
      ).toBeInTheDocument();
    });

    it.each([
      ["", "Usage: glow <file.md> [file ...]"],
      ["Blog/missing.md", "glow: Blog/missing.md: No such file or directory"],
      ["Blog", "glow: Blog: Is a directory"],
      [
        "Publications/cstar.pdf",
        "glow: Publications/cstar.pdf: Not a Markdown file",
      ],
    ])("reports an invalid glow request: %s", async (path, error) => {
      await user.type(terminalInput, `glow ${path}{enter}`);
      expect(screen.getByTestId("glow-invalid-arg")).toHaveTextContent(error);
    });

    it("reads the blog from home using its folder path", async () => {
      await user.type(terminalInput, "cat Blog/first-blog.md{enter}");
      expect(screen.getByTestId("latest-output")).toHaveTextContent(
        "Hello World"
      );
      expect(terminalInput.labels?.[0]?.textContent).toContain(":~$");
    });

    it.each([
      "../Blog/first-blog.md",
      "~/Blog/first-blog.md",
      "/home/cerrarlosojos/Blog/first-blog.md",
    ])("reads %s from another directory", async path => {
      await user.type(
        terminalInput,
        `cd Publications{enter}cat ${path}{enter}`
      );
      expect(
        within(screen.getByTestId("latest-output")).getByText(
          "~/Blog/first-blog.md"
        )
      ).toBeInTheDocument();
      expect(screen.getByTestId("latest-output")).toHaveTextContent(
        "Hello World"
      );
      expect(terminalInput.labels?.[0]?.textContent).toContain(
        "~/Publications$"
      );
    });

    it("keeps earlier file outputs tied to their original directory", async () => {
      await user.type(
        terminalInput,
        "cd Blog{enter}cat first-blog.md{enter}cd ~/Publications{enter}"
      );
      const output = screen.getByTestId("cat");
      expect(
        within(output).getByText("~/Blog/first-blog.md")
      ).toBeInTheDocument();
      expect(output).toHaveTextContent("Hello World");
      expect(terminalInput.labels?.[0]?.textContent).toContain(
        "~/Publications$"
      );
    });

    it("shows the paper description and clickable PDF source", async () => {
      await user.type(terminalInput, "cat Publications/cstar.pdf{enter}");
      const output = within(screen.getByTestId("latest-output"));
      expect(
        output.getByRole("link", { name: "https://arxiv.org/pdf/2504.02246" })
      ).toHaveAttribute("href", "https://arxiv.org/pdf/2504.02246");
      expect(output.getByText("~/Publications/cstar.pdf")).toBeInTheDocument();
      expect(screen.getByTestId("latest-output")).toHaveTextContent(
        "A proof-integrated language for C"
      );
    });

    it("shows a syntax hint when no filename is supplied", async () => {
      await user.type(terminalInput, "cat{enter}");
      expect(screen.getByTestId("cat-invalid-arg")).toHaveTextContent(
        "Usage: cat <file> [file ...]"
      );
    });

    it.each([
      ["missing.md", "No such file or directory"],
      ["Blog/missing.md", "No such file or directory"],
      ["/etc/passwd", "No such file or directory"],
      ["Blog", "Is a directory"],
      ["~", "Is a directory"],
    ])("reports an unreadable path: %s", async (path, error) => {
      await user.type(terminalInput, `cat ${path}{enter}`);
      expect(screen.getByTestId("cat-invalid-arg")).toHaveTextContent(
        `cat: ${path}: ${error}`
      );
    });

    it("still reads valid files when another requested file is missing", async () => {
      await user.type(
        terminalInput,
        "cat Blog/first-blog.md missing.md Publications/cstar.pdf{enter}"
      );
      const output = screen.getByTestId("latest-output");
      expect(
        within(output).getByText("~/Blog/first-blog.md")
      ).toBeInTheDocument();
      expect(
        within(output).getByText("~/Publications/cstar.pdf")
      ).toBeInTheDocument();
      expect(output).toHaveTextContent(
        "cat: missing.md: No such file or directory"
      );
    });

    it("completes folder paths, filenames, and the final file argument", async () => {
      await user.type(terminalInput, "cat Bl");
      await user.tab();
      expect(terminalInput.value).toBe("cat Blog/");
      await user.type(terminalInput, "fi");
      await user.tab();
      expect(terminalInput.value).toBe("cat Blog/first-blog.md");
      await user.keyboard("{enter}");
      expect(screen.getByTestId("latest-output")).toHaveTextContent(
        "Hello World"
      );
      await user.type(terminalInput, "cat Blog/first-blog.md  Publications/cs");
      await user.tab();
      expect(terminalInput.value).toBe(
        "cat Blog/first-blog.md  Publications/cstar.pdf"
      );
      await user.keyboard("{enter}");
      expect(
        screen.getByTestId("latest-output").querySelectorAll("fieldset")
      ).toHaveLength(2);
    });

    it("completes the Markdown filename inside Blog", async () => {
      await user.type(terminalInput, "cd Blog{enter}cat fi");
      await user.tab();
      expect(terminalInput.value).toBe("cat first-blog.md");
      await user.keyboard("{enter}");
      expect(screen.getByTestId("latest-output")).toHaveTextContent(
        "Hello World"
      );
    });
  });

  describe("Removed commands and redirects", () => {
    beforeEach(() => {
      window.open = vi.fn();
    });

    it("should reject the removed 'gui' cmd without opening a website", async () => {
      await user.type(terminalInput, "gui{enter}");
      expect(window.open).not.toHaveBeenCalled();
      expect(screen.getByTestId("not-found-0").textContent).toBe(
        "command not found: gui"
      );
    });

    it.each(["email", "emails", "history"])(
      "rejects the removed '%s' command",
      async cmd => {
        await user.type(terminalInput, `${cmd}{enter}`);
        expect(window.open).not.toHaveBeenCalled();
        expect(screen.getByTestId("not-found-0")).toHaveTextContent(
          `command not found: ${cmd}`
        );
      }
    );

    it("omits history from help and autocomplete", async () => {
      await user.type(terminalInput, "help{enter}");
      expect(
        within(screen.getByTestId("latest-output")).queryByText("history", {
          exact: true,
        })
      ).not.toBeInTheDocument();
      await user.type(terminalInput, "hi");
      await user.tab();
      expect(terminalInput.value).toBe("hi");
      await user.keyboard("{Control>}i{/Control}");
      expect(terminalInput.value).toBe("hi");
    });

    it("does not redirect for the retired projects go syntax", async () => {
      await user.type(terminalInput, "projects go 1{enter}");
      expect(window.open).not.toHaveBeenCalled();
      expect(screen.getByTestId("usage-output")).toHaveTextContent(
        "Usage: projects"
      );
    });

    it("does not redirect for the retired socials go syntax", async () => {
      await user.type(terminalInput, "socials go 1{enter}");
      expect(window.open).not.toHaveBeenCalled();
    });
  });

  describe("Social links and publications", () => {
    it("displays exactly three unnumbered sections with working link destinations", async () => {
      await user.type(terminalInput, "socials{enter}");
      const output = screen.getByTestId("latest-output");
      const list = within(output).getByRole("list");
      expect(list.tagName).toBe("UL");
      const items = within(list).getAllByRole("listitem");
      expect(items).toHaveLength(3);
      expect(items.map(item => item.firstElementChild?.textContent)).toEqual([
        "GitHub",
        "Email",
        "Publications",
      ]);
      expect(
        within(output).getByRole("link", {
          name: "https://github.com/cerrarlosojos",
        })
      ).toHaveAttribute("href", "https://github.com/cerrarlosojos");
      expect(
        within(output).getByRole("link", { name: "chenhoujin@stu.pku.edu.cn" })
      ).toHaveAttribute("href", "mailto:chenhoujin@stu.pku.edu.cn");
      expect(
        within(output).getByText(
          "C★: Unifying Programming and Verification in C"
        )
      ).toBeInTheDocument();
      expect(within(output).getByRole("link", { name: "PDF" })).toHaveAttribute(
        "href",
        "https://arxiv.org/pdf/2504.02246"
      );
      expect(
        within(output).getByRole("link", { name: "BibTeX" })
      ).toHaveAttribute("href", "https://arxiv.org/bibtex/2504.02246");
      expect(output).not.toHaveTextContent("Usage:");
      expect(within(output).queryByText("Homepage")).not.toBeInTheDocument();
      expect(within(output).queryByText("Blog")).not.toBeInTheDocument();
    });

    it("does not complete retired project/social arguments or the removed email command", async () => {
      await user.type(terminalInput, "socials ");
      await user.tab();
      expect(terminalInput.value).toBe("socials ");
      await user.clear(terminalInput);
      await user.type(terminalInput, "projects ");
      await user.tab();
      expect(terminalInput.value).toBe("projects ");
      await user.clear(terminalInput);
      await user.type(terminalInput, "em");
      await user.tab();
      expect(terminalInput.value).toBe("em");
    });
  });

  describe("Invalid Arguments", () => {
    const specialUsageCmds = ["themes"];
    const usageCmds = allCmds.filter(
      cmd =>
        !["echo", "ls", "cd", "cat", "glow", ...specialUsageCmds].includes(cmd)
    );

    usageCmds.forEach(cmd => {
      it(`should return usage component for ${cmd} cmd with invalid arg`, async () => {
        await user.type(terminalInput, `${cmd} sth{enter}`);
        expect(screen.getByTestId("usage-output").innerHTML).toBe(
          `Usage: ${cmd}`
        );
      });
    });

    specialUsageCmds.forEach(cmd => {
      it(`should return usage component for '${cmd}' cmd with invalid arg`, async () => {
        await user.type(terminalInput, `${cmd} sth{enter}`);
        expect(screen.getByTestId(`${cmd}-invalid-arg`)).toBeInTheDocument();
      });

      it(`should return usage component for '${cmd}' cmd with extra args`, async () => {
        await user.type(terminalInput, `${cmd} set light extra-arg{enter}`);
        expect(screen.getByTestId(`${cmd}-invalid-arg`)).toBeInTheDocument();
      });

      it(`should return usage component for '${cmd}' cmd with incorrect option`, async () => {
        await user.type(terminalInput, `${cmd} go light{enter}`);
        expect(screen.getByTestId(`${cmd}-invalid-arg`)).toBeInTheDocument();
      });
    });
  });

  describe("Keyboard shortcuts", () => {
    allCmds.forEach(cmd => {
      it(`should autocomplete '${cmd}' when 'Tab' is pressed`, async () => {
        await user.type(terminalInput, cmd.slice(0, 2));
        await user.tab();
        expect(terminalInput.value).toBe(cmd);
      });
    });

    allCmds.forEach(cmd => {
      it(`should autocomplete '${cmd}' when 'Ctrl + i' is pressed`, async () => {
        await user.type(terminalInput, cmd.slice(0, 2));
        await user.keyboard("{Control>}i{/Control}");
        expect(terminalInput.value).toBe(cmd);
      });
    });

    it("should clear when 'Ctrl + l' is pressed", async () => {
      await user.type(terminalInput, "echo hello{enter}");
      await user.keyboard("{Control>}l{/Control}");
      expect(screen.getByTestId("terminal-wrapper").children.length).toBe(1);
    });

    it("should go to previous back and forth when 'Up & Down Arrow' is pressed", async () => {
      await user.type(terminalInput, "about{enter}");
      await user.type(terminalInput, "whoami{enter}");
      await user.type(terminalInput, "pwd{enter}");
      await user.keyboard("{arrowup>3}");
      expect(terminalInput.value).toBe("about");
      await user.keyboard("{arrowup>2}");
      expect(terminalInput.value).toBe("welcome");
      await user.keyboard("{arrowdown>2}");
      expect(terminalInput.value).toBe("whoami");
      await user.keyboard("{arrowdown}");
      expect(terminalInput.value).toBe("pwd");
      await user.keyboard("{arrowdown}");
      expect(terminalInput.value).toBe("");
    });
  });
});
