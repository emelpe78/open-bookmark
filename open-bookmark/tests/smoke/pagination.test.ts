import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from "../../shared/constants/pagination";

describe("pagination constants", () => {
  it("defines expected page size options", () => {
    expect(PAGE_SIZE_OPTIONS).toEqual([10, 25, 50, 100]);
    expect(DEFAULT_PAGE_SIZE).toBe(10);
    expect(MAX_PAGE_SIZE).toBe(100);
  });
});
