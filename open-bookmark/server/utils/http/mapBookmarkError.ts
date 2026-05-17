import { BookmarkDomainError } from "#shared/errors/bookmarkErrors";

const STATUS_BY_CODE: Record<BookmarkDomainError["code"], number> = {
  NOT_FOUND: 404,
  DUPLICATE_URL: 409,
  INVALID_URL: 400,
  LOAD_FAILED: 500,
  EMPTY_TAG_NAME: 400,
};

export function mapBookmarkErrorToH3(error: unknown): never {
  if (error instanceof BookmarkDomainError) {
    throw createError({
      statusCode: STATUS_BY_CODE[error.code],
      statusMessage: error.message,
    });
  }

  throw error;
}
