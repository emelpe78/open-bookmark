/**
 * Keep in sync with open-bookmark/shared/lib/tagInputComposer.ts
 */
import { normalizeTagName } from "./normalizeTagName";

export interface TagInputState {
  fragment: string;
  fragmentNormalized: string;
  fragmentStart: number;
  cursorPos: number;
  completedTags: string[];
}

export function getTagInputState(
  input: string,
  cursorPos: number = input.length,
): TagInputState {
  const pos = Math.max(0, Math.min(cursorPos, input.length));
  const before = input.slice(0, pos);
  const lastComma = before.lastIndexOf(",");

  const fragmentRaw = lastComma >= 0 ? before.slice(lastComma + 1) : before;
  const fragment = fragmentRaw.trimStart();
  const fragmentStart =
    lastComma >= 0
      ? lastComma + 1 + (fragmentRaw.length - fragment.length)
      : pos - fragment.length;

  const completedSource = lastComma >= 0 ? before.slice(0, lastComma) : "";
  const completedTags = completedSource
    .split(",")
    .map((part) => normalizeTagName(part.trim()))
    .filter(Boolean);

  return {
    fragment,
    fragmentNormalized: normalizeTagName(fragment),
    fragmentStart,
    cursorPos: pos,
    completedTags,
  };
}

export function filterTagSuggestions(
  allTagNames: string[],
  state: TagInputState,
  limit = 12,
): string[] {
  const used = new Set(state.completedTags);
  const prefix = state.fragmentNormalized;

  return allTagNames
    .filter((name) => !used.has(name))
    .filter((name) => prefix.length === 0 || name.startsWith(prefix))
    .slice(0, limit);
}

export function applyTagSuggestion(
  input: string,
  suggestion: string,
  cursorPos: number = input.length,
): { value: string; cursorPos: number } {
  const state = getTagInputState(input, cursorPos);
  const tag = normalizeTagName(suggestion);
  if (!tag) {
    return { value: input, cursorPos };
  }

  const head = input.slice(0, state.fragmentStart);
  let tail = input.slice(state.cursorPos);
  const commaInTail = tail.indexOf(",");
  tail = commaInTail >= 0 ? tail.slice(commaInTail) : "";

  const value = tail
    ? `${head}${tag},${tail}`
    : `${head}${tag}, `;
  const cursorPosOut = tail
    ? head.length + tag.length + 1 + tail.length
    : value.length;

  return { value, cursorPos: cursorPosOut };
}
