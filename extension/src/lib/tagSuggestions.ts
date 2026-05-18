import { getServerBaseUrl } from "./config";
import { loadTagSuggestionsInto } from "./tagCache";

export async function loadTagSuggestions(
  datalist: HTMLDataListElement,
): Promise<void> {
  const baseUrl = await getServerBaseUrl();
  await loadTagSuggestionsInto(datalist, baseUrl);
}

export { refreshTagCache } from "./tagCache";
