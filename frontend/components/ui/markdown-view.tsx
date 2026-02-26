"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  code: ({ children }) => (
    <code className="rounded bg-muted px-1 py-0.5 text-sm font-mono">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-lg bg-muted p-3 text-sm">{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-2">
      {children}
    </blockquote>
  ),
  img: ({ src, alt, ...rest }) => {
    if (!src) return null;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt ?? ""}
        className={cn("my-2 max-w-full rounded-md h-auto", rest.className)}
        loading="lazy"
        {...rest}
      />
    );
  },
};

export type MarkdownViewProps = {
  content: string;
  className?: string;
};

/**
 * Renders markdown using react-markdown with remark-gfm and a rehype plugin
 * that turns raw image syntax in text nodes into images.
 *
 * @see https://github.com/remarkjs/react-markdown
 * @see https://www.npmjs.com/package/react-markdown
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
