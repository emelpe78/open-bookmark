const LAST_TAGS_KEY = "lastTagsInput";
const LAST_NOTES_KEY = "lastNotes";

export interface LastFormInputs {
  tags: string;
  notes: string;
}

export async function getLastFormInputs(): Promise<LastFormInputs> {
  const result = await chrome.storage.local.get([LAST_TAGS_KEY, LAST_NOTES_KEY]);
  return {
    tags: typeof result[LAST_TAGS_KEY] === "string" ? result[LAST_TAGS_KEY] : "",
    notes:
      typeof result[LAST_NOTES_KEY] === "string" ? result[LAST_NOTES_KEY] : "",
  };
}

export async function setLastFormInputs(inputs: LastFormInputs): Promise<void> {
  await chrome.storage.local.set({
    [LAST_TAGS_KEY]: inputs.tags,
    [LAST_NOTES_KEY]: inputs.notes,
  });
}
