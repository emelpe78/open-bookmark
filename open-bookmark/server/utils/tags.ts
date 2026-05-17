import { createBookmarkService } from "../domain/createBookmarkService";

export { parseTagInput } from "#shared/lib/parseTagInput";

export function listTagsWithCounts() {
  return createBookmarkService().listTags();
}
