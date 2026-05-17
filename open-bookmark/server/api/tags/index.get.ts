import { listTagsWithCounts } from "../../utils/tags";

export default defineEventHandler(() => {
  return { tags: listTagsWithCounts() };
});
