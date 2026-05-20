import { createBookmarkService } from "../../domain/createBookmarkService";

export default defineEventHandler(() => {
  return { tags: createBookmarkService().listTags() };
});
