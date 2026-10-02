import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { parse } from "yaml";
import { MarkdownContent, MarkdownMetadata } from "./styles/Cat.styled";
import { FileLink } from "./styles/Ls.styled";

function readMarkdown(content: string) {
  const frontMatter =
    /^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/.exec(
      content
    );
  let metadata: Record<string, unknown> = {};
  let body = content;

  if (frontMatter) {
    try {
      const parsed: unknown = parse(frontMatter[1]);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        metadata = parsed as Record<string, unknown>;
      }
      body = content.slice(frontMatter[0].length);
    } catch {
      // An invalid metadata block remains readable as part of the document.
    }
  }

  return {
    body,
    title: typeof metadata.title === "string" ? metadata.title : "",
    date: typeof metadata.date === "string" ? metadata.date : "",
    tags: Array.isArray(metadata.tags)
      ? metadata.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
  };
}

const MarkdownPreview: React.FC<{ content: string }> = ({ content }) => {
  const { body, title, date, tags } = readMarkdown(content);

  return (
    <MarkdownContent data-testid="markdown-preview">
      {title && <h1>{title}</h1>}
      {(date || tags.length > 0) && (
        <MarkdownMetadata>
          {date && <time dateTime={date}>{date}</time>}
          {tags.map((tag, index) => (
            <span key={`${tag}-${index}`}>{tag}</span>
          ))}
        </MarkdownMetadata>
      )}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: ({ href, title, children }) => (
            <FileLink
              href={href}
              title={title}
              target={href?.startsWith("#") ? undefined : "_blank"}
              rel="noreferrer"
            >
              {children}
            </FileLink>
          ),
          table: ({ children }) => (
            <div className="table-wrapper">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </MarkdownContent>
  );
};

export default MarkdownPreview;
