import { createBookmarkService } from "../domain/createBookmarkService";

export { parseTagInput } from "../../../packages/tag-utils/src/parseTagInput";

export function listTagsWithCounts() {
  return createBookmarkService().listTags();
}
