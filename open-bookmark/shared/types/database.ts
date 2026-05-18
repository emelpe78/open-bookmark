export interface DatabaseInfo {
  path: string;
  sizeBytes: number | null;
  bookmarkCount: number;
  /** Nitro was started by the desktop shell (Application Support DB). */
  isDesktop: boolean;
}
