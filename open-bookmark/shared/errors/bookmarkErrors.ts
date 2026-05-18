export const BOOKMARK_ERROR_CODES = [
  "NOT_FOUND",
  "DUPLICATE_URL",
  "INVALID_URL",
  "LOAD_FAILED",
  "EMPTY_TAG_NAME",
  "TAG_NOT_FOUND",
  "DUPLICATE_TAG_NAME",
  "EMPTY_LIST_NAME",
  "LIST_NOT_FOUND",
  "DUPLICATE_LIST_NAME",
] as const;

export type BookmarkErrorCode = (typeof BOOKMARK_ERROR_CODES)[number];

export const BOOKMARK_ERROR_MESSAGES: Record<BookmarkErrorCode, string> = {
  NOT_FOUND: "Bookmark nicht gefunden.",
  DUPLICATE_URL: "Ein Bookmark mit dieser URL existiert bereits.",
  INVALID_URL: "Ungültige URL.",
  LOAD_FAILED: "Bookmark konnte nicht geladen werden.",
  EMPTY_TAG_NAME: "Tag-Name darf nicht leer sein.",
  TAG_NOT_FOUND: "Tag nicht gefunden.",
  DUPLICATE_TAG_NAME: "Ein Tag mit diesem Namen existiert bereits.",
  EMPTY_LIST_NAME: "Listenname darf nicht leer sein.",
  LIST_NOT_FOUND: "Liste nicht gefunden.",
  DUPLICATE_LIST_NAME: "Eine Liste mit diesem Namen existiert bereits.",
};

export class BookmarkDomainError extends Error {
  readonly code: BookmarkErrorCode;

  constructor(code: BookmarkErrorCode, message?: string) {
    super(message ?? BOOKMARK_ERROR_MESSAGES[code]);
    this.name = "BookmarkDomainError";
    this.code = code;
  }
}

export function getBookmarkErrorMessage(code: BookmarkErrorCode): string {
  return BOOKMARK_ERROR_MESSAGES[code];
}
