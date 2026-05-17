import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";
import markedFootnote from "marked-footnote";

marked.use(markedFootnote());
marked.setOptions({
  gfm: true,
  breaks: true,
});

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "s",
    "del",
    "code",
    "pre",
    "blockquote",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "a",
    "hr",
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "th",
    "td",
    "input",
    "div",
    "img",
    "details",
    "summary",
    "section",
    "sup",
  ],
  ALLOWED_ATTR: [
    "href",
    "title",
    "target",
    "rel",
    "type",
    "checked",
    "disabled",
    "class",
    "src",
    "alt",
    "id",
    "aria-label",
    "aria-describedby",
    "data-footnote-ref",
    "data-footnote-backref",
    "data-footnotes",
  ],
};

export function renderMarkdownHtml(markdown: string | null | undefined): string {
  if (!markdown?.trim()) {
    return "";
  }

  const rawHtml = marked.parse(markdown, { async: false }) as string;
  const sanitized = DOMPurify.sanitize(rawHtml, PURIFY_CONFIG);

  return sanitized
    .replace(/<table>/g, '<div class="markdown-table-wrap"><table>')
    .replace(/<\/table>/g, "</table></div>")
    .replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');
}

export function normalizeNotesInput(notes: string | undefined | null): string | null {
  if (notes === undefined || notes === null) {
    return null;
  }

  const trimmed = notes.trim();
  return trimmed.length > 0 ? trimmed : null;
}
