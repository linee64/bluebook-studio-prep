const KEYS = {
  HISTORY: 'bb_sat_verbal_history_v1',
  BOOKMARKS: 'bb_sat_verbal_bookmarks_v1',
  HIGHLIGHTS: 'bb_sat_verbal_highlights_v1',
  SESSION: 'bb_sat_verbal_session_v1',
};

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export function loadHistory() {
  return safeRead(KEYS.HISTORY, {});
}

export function saveHistory(history) {
  safeWrite(KEYS.HISTORY, history);
}

export function loadBookmarks() {
  return safeRead(KEYS.BOOKMARKS, []);
}

export function saveBookmarks(bookmarks) {
  safeWrite(KEYS.BOOKMARKS, bookmarks);
}

export function loadHighlights() {
  return safeRead(KEYS.HIGHLIGHTS, {});
}

export function saveHighlights(highlights) {
  safeWrite(KEYS.HIGHLIGHTS, highlights);
}

export function loadActiveSession() {
  return safeRead(KEYS.SESSION, null);
}

export function saveActiveSession(session) {
  if (!session) {
    try {
      localStorage.removeItem(KEYS.SESSION);
    } catch {
      // ignore
    }
  } else {
    safeWrite(KEYS.SESSION, session);
  }
}

export function clearAllProgress() {
  Object.values(KEYS).forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      // ignore
    }
  });
}

