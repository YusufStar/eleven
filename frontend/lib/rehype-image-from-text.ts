import type { Node } from "unist";
import { visit } from "unist-util-visit";

/**
 * Matches markdown image syntax ![alt](url).
 * Alt can be empty; url is everything between ( and ) on the same line.
 */
const IMAGE_MD_REGEX = /^\s*!\[([^\]]*)\]\(([^)]+)\)\s*$/;

/** Only allow https, http, or relative URLs. Reject javascript:, data:, etc. */
function sanitizeUrl(u: string): string {
  const t = u.trim();
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith("/") && !t.startsWith("//")) return t;
  if (!t.includes(":")) return t;
  return "";
}

type TextNode = { type: "text"; value?: string };
type Parent = { type: string; children: unknown[] };
type ElementNode = { type: "element"; tagName: string; properties: Record<string, string>; children: unknown[] };

/**
 * Rehype plugin: turn text nodes that are raw markdown image syntax into
 * image elements. Use when the markdown parser left them as plain text
 * (e.g. inside code or due to line endings).
 *
 * @see https://github.com/remarkjs/react-markdown#plugins
 */
export function rehypeImageFromText() {
  return (tree: Node) => {
    visit(tree, "text", (node: TextNode, index: number | undefined, parent: Parent | undefined) => {
      if (index == null || !parent?.children) return;
      let value = node.value;
      if (typeof value !== "string") return;
      value = value.replace(/\r\n?/g, "\n").trim();
      const match = value.match(IMAGE_MD_REGEX);
      if (!match) return;
      const alt = (match[1] ?? "").trim();
      const rawUrl = (match[2] ?? "").trim();
      if (!rawUrl) return;
      const url = sanitizeUrl(rawUrl);
      if (!url) return;
      const imgNode: ElementNode = {
        type: "element",
        tagName: "img",
        properties: { src: url, alt },
        children: [],
      };
      parent.children[index] = imgNode;
    });
  };
}
