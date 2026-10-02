import { describe, expect, it } from "vitest";
import { render, screen } from "../utils/test-utils";
import MarkdownPreview from "../components/MarkdownPreview";

describe("Markdown preview", () => {
  it("renders headings, emphasis, lists, links, and code as document elements", () => {
    const { container } = render(
      <MarkdownPreview
        content={[
          "# A post",
          "",
          "A **bold** paragraph with [GitHub](https://github.com/cerrarlosojos).",
          "",
          "- A list item",
          "",
          "```ts",
          "const value = 1;",
          "```",
        ].join("\n")}
      />
    );
    expect(screen.getByRole("heading", { name: "A post" })).toBeInTheDocument();
    expect(container.querySelector("strong")).toHaveTextContent("bold");
    expect(screen.getByRole("listitem")).toHaveTextContent("A list item");
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/cerrarlosojos"
    );
    expect(container.querySelector("pre code")).toHaveTextContent(
      "const value = 1;"
    );
  });

  it("renders GitHub-style tables and task lists", () => {
    render(
      <MarkdownPreview
        content={[
          "| Topic | Status |",
          "| --- | --- |",
          "| PL | Reading |",
          "",
          "- [x] Done",
        ].join("\n")}
      />
    );
    expect(screen.getByRole("table")).toHaveTextContent("PL");
    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  it("handles quoted YAML titles and Windows line endings without exposing metadata", () => {
    const { container } = render(
      <MarkdownPreview
        content={
          '---\r\ntitle: "Notes: PL"\r\ndate: 2026-10-02\r\ntags: [PL, Reading]\r\n---\r\n\r\nHello World!'
        }
      />
    );
    expect(
      screen.getByRole("heading", { name: "Notes: PL" })
    ).toBeInTheDocument();
    expect(container.querySelector("time")).toHaveAttribute(
      "datetime",
      "2026-10-02"
    );
    expect(container.querySelector("p")).toHaveTextContent("Hello World!");
    expect(container).not.toHaveTextContent("tags:");
  });

  it("keeps malformed metadata readable without crashing", () => {
    render(
      <MarkdownPreview
        content={"---\ntitle: [unfinished\n---\n\nHello World!"}
      />
    );
    expect(screen.getByTestId("markdown-preview")).toHaveTextContent(
      "Hello World!"
    );
  });

  it("does not execute embedded HTML or expose executable link URLs", () => {
    const { container } = render(
      <MarkdownPreview
        content={
          "<script>alert(1)</script>\n\n[unsafe](javascript:alert%281%29)"
        }
      />
    );
    expect(container.querySelector("script")).not.toBeInTheDocument();
    expect(container.querySelector("a")?.getAttribute("href")).not.toMatch(
      /^javascript:/
    );
  });
});
