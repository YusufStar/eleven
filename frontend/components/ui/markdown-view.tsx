"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { rehypeImageFromText } from "@/lib/rehype-image-from-text";
import { cn } from "@/lib/utils";

/**
 * Only allow safe URLs (https, http, relative). Blocks javascript:, data:, etc.
 * @see https://github.com/remarkjs/react-markdown#security
 */
function urlTransform(url: string): string {
  const t = url?.trim() ?? "";
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith("/") && !t.startsWith("//")) return t;
  if (!t.includes(":")) return t;
  return "";
}

/** Only allow safe URLs for img src (same as urlTransform). */
function sanitizeImgSrc(src: string | undefined): string {
  if (!src?.trim()) return "";
  const t = src.trim();
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith("/") && !t.startsWith("//")) return t;
  if (!t.includes(":")) return t;
  return "";
}

const components: Components = {
  p: ({ children }) => <p className="my-2 leading-relaxed text-sm text-foreground">{children}</p>,
  h1: ({ children }) => <h1 className="my-3 text-lg font-semibold tracking-tight text-foreground">{children}</h1>,
  h2: ({ children }) => <h2 className="my-3 text-base font-semibold tracking-tight text-foreground">{children}</h2>,
  h3: ({ children }) => <h3 className="my-2 text-sm font-semibold tracking-tight text-foreground">{children}</h3>,
  ul: ({ children }) => <ul className="my-2 list-disc pl-5 space-y-0.5 text-sm text-foreground">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal pl-5 space-y-0.5 text-sm text-foreground">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a href={href} className="text-primary underline underline-offset-2 hover:no-underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className ?? "");
    const code = String(children).replace(/\n$/, "");
    const lang = match ? match[1] : "text";
    const isBlock = match || code.includes("\n");

    if (isBlock && code.length > 0) {
      return (
        <div className="my-3 overflow-hidden rounded-lg border border-border bg-[#282c34]">
          <div className="flex items-center justify-between border-b border-border bg-[#21252b] px-3 py-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{lang}</span>
          </div>
          <SyntaxHighlighter
            language={lang}
            style={oneDark}
            customStyle={{
              margin: 0,
              padding: "0.75rem 1rem",
              fontSize: "0.8125rem",
              lineHeight: 1.6,
              background: "transparent",
            }}
            codeTagProps={{ style: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" } }}
            showLineNumbers={code.split("\n").length > 1}
            lineNumberStyle={{ minWidth: "2.25em", paddingRight: "1em", color: "rgba(255,255,255,0.4)", userSelect: "none" }}
            PreTag="div"
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );
    }

    return (
      <code className={cn("rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-foreground")} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
  table: ({ children }) => (
    <div className="my-3 w-full overflow-auto rounded-lg border border-border">
      <table className="w-full min-w-[200px] border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-border last:border-b-0">{children}</tr>,
  th: ({ align, children, ...props }) => (
    <th
      align={align ?? undefined}
      className={cn(
        "border-border px-3 py-2 text-left font-semibold text-foreground",
        align === "center" && "text-center",
        align === "right" && "text-right"
      )}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ align, children, ...props }) => (
    <td
      align={align ?? undefined}
      className={cn(
        "border-border px-3 py-2 text-left text-foreground",
        align === "center" && "text-center",
        align === "right" && "text-right"
      )}
      {...props}
    >
      {children}
    </td>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-2">
      {children}
    </blockquote>
  ),
  img: ({ src, alt, ...rest }) => {
    const safeSrc = sanitizeImgSrc(typeof src === "string" ? src : undefined);
    if (!safeSrc) return null;
    return (
      <span className="my-2 block overflow-hidden rounded-lg border border-border bg-muted/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={safeSrc}
          alt={alt ?? ""}
          className={cn("max-w-full h-auto object-contain", rest.className)}
          loading="lazy"
          {...rest}
        />
        {alt && String(alt).trim() ? (
          <span className="block border-t border-border px-2 py-1.5 text-xs text-muted-foreground">{String(alt)}</span>
        ) : null}
      </span>
    );
  },
};

export type MarkdownViewProps = {
  content: string;
  className?: string;
};

/**
 * Renders markdown with react-markdown, remark-gfm, syntax-highlighted code blocks,
 * and safe image rendering.
 */
export function MarkdownView({ content, className }: MarkdownViewProps) {
  if (!content?.trim()) {
    return <p className={cn("text-sm text-muted-foreground", className)}>No content.</p>;
  }
  return (
    <div className={cn("max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeImageFromText]}
        components={components}
        urlTransform={urlTransform}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
