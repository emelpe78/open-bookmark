import { describe, expect, it } from "vitest";
import { extractMetadataFromHtml } from "../../server/utils/metadata";

describe("extractMetadataFromHtml", () => {
  it("extracts og metadata", () => {
    const html = `
      <html>
        <head>
          <title>Page Title</title>
          <meta property="og:title" content="OG Title" />
          <meta property="og:description" content="OG Description" />
          <meta property="og:image" content="/image.png" />
          <meta property="og:site_name" content="Example" />
        </head>
      </html>
    `;

    const metadata = extractMetadataFromHtml(html, "https://example.com/page");

    expect(metadata.title).toBe("OG Title");
    expect(metadata.description).toBe("OG Description");
    expect(metadata.image_url).toBe("https://example.com/image.png");
    expect(metadata.site_name).toBe("Example");
  });

  it("falls back to title tag and hostname", () => {
    const html = "<html><head><title>Fallback</title></head></html>";
    const metadata = extractMetadataFromHtml(html, "https://test.dev/");

    expect(metadata.title).toBe("Fallback");
    expect(metadata.site_name).toBe("test.dev");
  });
});
