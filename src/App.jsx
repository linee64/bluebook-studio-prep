import React, { useCallback, useEffect, useMemo, useState } from 'react';
import rawQuestions from './data/questions.json';
import initialCustomPacks from './data/customPacks.json';
import {
  loadHistory,
  saveHistory,
  loadBookmarks,
  saveBookmarks,
  loadHighlights,
  saveHighlights,
  loadActiveSession,
  saveActiveSession,
  clearAllProgress,
} from './utils/storage';
import { HomeHub } from './components/HomeHub';
import { ExamWorkspace } from './components/ExamWorkspace';
import { ResultsScreen } from './components/ResultsScreen';

export default function App() {
  const [history, setHistory] = useState(() => loadHistory());
  const [bookmarks, setBookmarks] = useState(() => loadBookmarks());
  const [highlights, setHighlights] = useState(() => loadHighlights());
  const [customPacks, setCustomPacks] = useState(() => initialCustomPacks || []);
  const [session, setSession] = useState(() => loadActiveSession());
  const [view, setView] = useState('home'); // 'home' | 'exam' | 'results'

  const allQuestions = useMemo(() => {
    const extra = customPacks.flatMap((pack) => pack.questions || []);
    return [...rawQuestions, ...extra];
  }, [customPacks]);

  const questionMap = useMemo(() => {
    const map = {};
    allQuestions.forEach((q) => {
      map[q.uid] = q;
    });
    return map;
  }, [allQuestions]);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  useEffect(() => {
    saveBookmarks(bookmarks);
  }, [bookmarks]);

  useEffect(() => {
    saveHighlights(highlights);
  }, [highlights]);

  useEffect(() => {
    saveActiveSession(session);
  }, [session]);

  const handleStartSession = useCallback(({ title, subtitle, mode, timed, durationSec, questionUids }) => {
    const newSession = {
      id: `${Date.now()}`,
      title,
      subtitle,
      mode,
      timed,
      durationSec,
      elapsedSec: 0,
      questionUids,
      currentIndex: 0,
      answers: {},
      checked: {},
      eliminated: {},
      flagged: [],
      submitted: false,
    };
    setSession(newSession);
    setView('exam');
  }, []);

  const handleSelectAnswer = useCallback((uid, letter) => {
    setSession((prev) => {
      if (!prev || prev.submitted) return prev;
      return {
        ...prev,
        answers: { ...prev.answers, [uid]: letter },
      };
    });
  }, []);

  const handleCheckAnswer = useCallback(
    (uid) => {
      setSession((prev) => {
        if (!prev) return prev;
        const selected = prev.answers[uid];
        const q = questionMap[uid];
        if (!selected || !q) return prev;
        setHistory((hPrev) => ({
          ...hPrev,
          [uid]: {
            selected,
            isCorrect: selected === q.correctAnswer,
            updatedAt: Date.now(),
          },
        }));
        return {
          ...prev,
          checked: { ...prev.checked, [uid]: true },
        };
      });
    },
    [questionMap]
  );

  const handleToggleEliminate = useCallback((uid, letter) => {
    setSession((prev) => {
      if (!prev || prev.submitted) return prev;
      const curList = prev.eliminated[uid] || [];
      const exists = curList.includes(letter);
      const nextList = exists ? curList.filter((l) => l !== letter) : [...curList, letter];
      const nextAnswers = { ...prev.answers };
      if (!exists && nextAnswers[uid] === letter) {
        delete nextAnswers[uid];
      }
      return {
        ...prev,
        answers: nextAnswers,
        eliminated: { ...prev.eliminated, [uid]: nextList },
      };
    });
  }, []);

  const handleToggleSessionFlag = useCallback((uid) => {
    setSession((prev) => {
      if (!prev) return prev;
      const exists = prev.flagged.includes(uid);
      return {
        ...prev,
        flagged: exists ? prev.flagged.filter((id) => id !== uid) : [...prev.flagged, uid],
      };
    });
  }, []);

  const handleToggleBookmark = useCallback((uid) => {
    setBookmarks((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  }, []);

  const handleAddHighlight = useCallback((uid, text, color) => {
    setHighlights((prev) => {
      const existing = prev[uid] || [];
      if (existing.some((h) => h.text === text)) return prev;
      return {
        ...prev,
        [uid]: [...existing, { id: `${Date.now()}-${Math.random()}`, text, color }],
      };
    });
  }, []);

  const handleRemoveHighlight = useCallback((uid, hlId) => {
    setHighlights((prev) => ({
      ...prev,
      [uid]: (prev[uid] || []).filter((h) => h.id !== hlId),
    }));
  }, []);

  const handleClearHighlights = useCallback((uid) => {
    setHighlights((prev) => {
      const copy = { ...prev };
      delete copy[uid];
      return copy;
    });
  }, []);

  const handleNavigate = useCallback((idx) => {
    setSession((prev) => {
      if (!prev) return prev;
      const clamped = Math.max(0, Math.min(prev.questionUids.length - 1, idx));
      return { ...prev, currentIndex: clamped };
    });
  }, []);

  const handleTickTimer = useCallback(() => {
    setSession((prev) => {
      if (!prev || prev.submitted) return prev;
      const nextElapsed = prev.elapsedSec + 1;
      if (prev.timed && nextElapsed >= prev.durationSec) {
        setHistory((hPrev) => {
          const next = { ...hPrev };
          prev.questionUids.forEach((uid) => {
            const sel = prev.answers[uid];
            const q = questionMap[uid];
            if (sel && q) {
              next[uid] = {
                selected: sel,
                isCorrect: sel === q.correctAnswer,
                updatedAt: Date.now(),
              };
            }
          });
          return next;
        });
        setView('results');
        return { ...prev, elapsedSec: prev.durationSec, submitted: true };
      }
      return { ...prev, elapsedSec: nextElapsed };
    });
  }, [questionMap]);

  const handleSubmitSession = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      setHistory((hPrev) => {
        const next = { ...hPrev };
        prev.questionUids.forEach((uid) => {
          const sel = prev.answers[uid];
          const q = questionMap[uid];
          if (sel && q) {
            next[uid] = {
              selected: sel,
              isCorrect: sel === q.correctAnswer,
              updatedAt: Date.now(),
            };
          }
        });
        return next;
      });
      return { ...prev, submitted: true };
    });
    setView('results');
  }, [questionMap]);

  const handleResetProgress = useCallback(() => {
    clearAllProgress();
    setHistory({});
    setBookmarks([]);
    setHighlights({});
    setSession(null);
    setView('home');
  }, []);

  if (view === 'exam' && session) {
    return (
      <ExamWorkspace
        session={session}
        questionMap={questionMap}
        bookmarks={bookmarks}
        highlights={highlights}
        onSelectAnswer={handleSelectAnswer}
        onCheckAnswer={handleCheckAnswer}
        onToggleEliminate={handleToggleEliminate}
        onToggleSessionFlag={handleToggleSessionFlag}
        onToggleBookmark={handleToggleBookmark}
        onAddHighlight={handleAddHighlight}
        onRemoveHighlight={handleRemoveHighlight}
        onClearHighlights={handleClearHighlights}
        onNavigate={handleNavigate}
        onTickTimer={handleTickTimer}
        onSubmitSession={handleSubmitSession}
        onExitToHome={() => setView('home')}
        onOpenResults={() => setView('results')}
      />
    );
  }

  if (view === 'results' && session) {
    return (
      <ResultsScreen
        session={session}
        questionMap={questionMap}
        onReviewQuestion={(idx) => {
          handleNavigate(idx);
          setView('exam');
        }}
        onRetryMistakes={(mistakeUids) =>
          handleStartSession({
            title: `${session.title} — Mistakes`,
            subtitle: `${mistakeUids.length} Questions`,
            mode: 'practice',
            timed: false,
            durationSec: 0,
            questionUids: mistakeUids,
          })
        }
        onReturnHome={() => setView('home')}
      />
    );
  }

  return (
    <HomeHub
      baseQuestions={rawQuestions}
      allQuestions={allQuestions}
      customPacks={customPacks}
      onUpdateCustomPacks={setCustomPacks}
      history={history}
      bookmarks={bookmarks}
      activeSession={session}
      onResumeSession={() => setView('exam')}
      onStartSession={handleStartSession}
      onResetProgress={handleResetProgress}
    />
  );
}
