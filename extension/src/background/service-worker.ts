import { isSaveablePageUrl, resolvePageUrlForTab } from "../lib/activeTab";
import { saveBookmark } from "../lib/saveBookmark";

const MENU_SAVE_PAGE = "openbookmark-save-page";
const MENU_SAVE_LINK = "openbookmark-save-link";

function showBadgeFeedback(success: boolean) {
  chrome.action.setBadgeBackgroundColor({ color: success ? "#059669" : "#dc2626" });
  chrome.action.setBadgeText({ text: success ? "✓" : "!" });
  setTimeout(() => {
    chrome.action.setBadgeText({ text: "" });
  }, 3000);
}

async function saveUrlFromContext(url: string) {
  if (!isSaveablePageUrl(url)) {
    showBadgeFeedback(false);
    return;
  }

  try {
    await saveBookmark(url);
    showBadgeFeedback(true);
  } catch {
    showBadgeFeedback(false);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_SAVE_PAGE,
      title: "Aktuelle Seite in Open Bookmark speichern",
      contexts: ["page"],
    });
    chrome.contextMenus.create({
      id: MENU_SAVE_LINK,
      title: "Link in Open Bookmark speichern",
      contexts: ["link"],
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_SAVE_LINK && info.linkUrl) {
    void saveUrlFromContext(info.linkUrl);
    return;
  }

  if (info.menuItemId === MENU_SAVE_PAGE && tab) {
    void resolvePageUrlForTab(tab).then((url) => {
      if (url) {
        void saveUrlFromContext(url);
      } else {
        showBadgeFeedback(false);
      }
    });
  }
});
