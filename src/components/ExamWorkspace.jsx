import React, { useEffect, useRef, useState } from 'react';
import {
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Eye,
  EyeOff,
  Highlighter,
  LogOut,
  CheckCircle2,
  XCircle,
  ZoomIn,
  X,
  Eraser,
  Type,
  HelpCircle,
  Flag,
  Bot,
  Sparkles,
  Check,
} from 'lucide-react';
import { RichSegments } from './RichText';
import { StarkaTriggerButton, StarkaSidePanel } from './StarkaExplain';

function formatTime(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function ExamWorkspace({
  session,
  questionMap,
  bookmarks,
  highlights,
  onSelectAnswer,
  onCheckAnswer,
  onToggleEliminate,
  onToggleSessionFlag,
  onToggleBookmark,
  onAddHighlight,
  onRemoveHighlight,
  onClearHighlights,
  onNavigate,
  onTickTimer,
  onSubmitSession,
  onExitToHome,
  onOpenResults,
}) {
  const [hideTimer, setHideTimer] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [eliminatorMode, setEliminatorMode] = useState(false);
  const [hlColor, setHlColor] = useState(null); // null | 'yellow' | 'blue' | 'pink'
  const [fontScale, setFontScale] = useState('md'); // 'sm' | 'md' | 'lg'
  const [zoomImg, setZoomImg] = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [starkaOpen, setStarkaOpen] = useState(false);

  const passageRef = useRef(null);

  const total = session.questionUids.length;
  const currentUid = session.questionUids[session.currentIndex];
  const question = questionMap[currentUid];

  useEffect(() => {
    setStarkaOpen(false);
  }, [currentUid]);

  const isReview = session.submitted;
  const selected = session.answers[currentUid] || null;
  const isChecked = isReview || (session.mode === 'practice' && Boolean(session.checked[currentUid]));
  const eliminated = session.eliminated[currentUid] || [];
  const isFlagged = session.flagged.includes(currentUid);
  const isBookmarked = bookmarks.includes(currentUid);
  const qHighlights = highlights[currentUid] || [];

  // Timer tick every second when not submitted
  useEffect(() => {
    if (isReview) return;
    const id = setInterval(() => {
      onTickTimer();
    }, 1000);
    return () => clearInterval(id);
  }, [isReview, onTickTimer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (zoomImg && e.key === 'Escape') {
        setZoomImg(null);
        return;
      }
      if (showMap && e.key === 'Escape') {
        setShowMap(false);
        return;
      }
      if (e.key === 'ArrowRight') {
        if (session.currentIndex < total - 1) onNavigate(session.currentIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        if (session.currentIndex > 0) onNavigate(session.currentIndex - 1);
      } else if (!isChecked && ['1', '2', '3', '4', 'a', 'b', 'c', 'd'].includes(e.key.toLowerCase())) {
        const keyMap = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', a: 'A', b: 'B', c: 'C', d: 'D' };
        const letter = keyMap[e.key.toLowerCase()];
        if (letter && !eliminated.includes(letter)) {
          onSelectAnswer(currentUid, letter);
        }
      } else if (e.key.toLowerCase() === 'f') {
        onToggleSessionFlag(currentUid);
      } else if (e.key.toLowerCase() === 'e') {
        setEliminatorMode((v) => !v);
      } else if (e.key === 'Enter' && session.mode === 'practice' && selected && !isChecked) {
        onCheckAnswer(currentUid);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [
    session.currentIndex,
    session.mode,
    total,
    currentUid,
    selected,
    isChecked,
    eliminated,
    zoomImg,
    showMap,
    onNavigate,
    onSelectAnswer,
    onCheckAnswer,
    onToggleSessionFlag,
  ]);

  const handlePassageMouseUp = () => {
    if (!hlColor) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const text = sel.toString().trim();
    if (text.length < 2 || text.length > 260) return;
    if (passageRef.current && passageRef.current.contains(sel.anchorNode)) {
      onAddHighlight(currentUid, text, hlColor);
      sel.removeAllRanges();
    }
  };

  if (!question) return null;

  const remainingSec = session.timed ? Math.max(0, session.durationSec - session.elapsedSec) : session.elapsedSec;
  const lowTime = session.timed && !isReview && remainingSec <= 300;
  const answeredCount = session.questionUids.filter((uid) => Boolean(session.answers[uid])).length;

  const fontSizeClass =
    fontScale === 'sm'
      ? 'text-[15px] leading-[1.7]'
      : fontScale === 'lg'
      ? 'text-[19px] leading-[1.78]'
      : 'text-[17px] leading-[1.75]';

  const handleOptionClick = (letter) => {
    if (isChecked) return;
    if (eliminatorMode) {
      onToggleEliminate(currentUid, letter);
      return;
    }
    if (eliminated.includes(letter)) return;
    onSelectAnswer(currentUid, letter);
  };

  return (
    <div className="h-screen flex flex-col bg-[#F5F7FC] text-[#17233C] overflow-hidden">
      {/* Top Bluebook-style Toolbar */}
      <header className="bg-white border-b-2 border-[#DCE4F3] px-3 sm:px-6 h-16 shrink-0 flex items-center justify-between gap-2 z-30">
        {/* Left: Section & Directions */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onExitToHome}
            className="bb-btn inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border-2 border-[#D9E2F2] bg-[#F8FAFC] hover:bg-[#EEF4FF] text-xs font-bold text-[#334155] cursor-pointer shrink-0"
            title="Save & Exit to Hub"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Home</span>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-extrabold text-[#17233C] truncate">
                {session.title}
              </span>
              {isReview && (
                <span className="px-2 py-0.5 rounded-full bg-[#EEF4FF] text-[#284B9E] border border-[#BFD3FA] text-[11px] font-extrabold">
                  Review
                </span>
              )}
            </div>
            <button
              onClick={() => setShowDirections((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#284B9E] hover:underline cursor-pointer"
            >
              <span>Directions</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center: Bluebook Timer */}
        <div className="flex flex-col items-center justify-center shrink-0">
          {!hideTimer ? (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-extrabold text-sm sm:text-base tabular-nums ${
                lowTime
                  ? 'bg-[#FFF1F2] text-[#E11D48] border-2 border-[#FDA4AF] animate-pulse'
                  : 'text-[#17233C]'
              }`}
            >
              <Clock className="w-4 h-4 text-[#284B9E]" />
              <span>{formatTime(remainingSec)}</span>
            </div>
          ) : (
            <div className="text-xs font-bold text-[#64748B] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Hidden</span>
            </div>
          )}
          <button
            onClick={() => setHideTimer((v) => !v)}
            className="mt-0.5 text-[11px] font-bold text-[#5A6B8C] hover:text-[#17233C] inline-flex items-center gap-1 cursor-pointer"
          >
            {hideTimer ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>{hideTimer ? 'Show' : 'Hide'}</span>
          </button>
        </div>

        {/* Right: Highlights, Font, Eliminator */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Highlighter Palette */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl border-2 border-[#DCE4F3] bg-[#F8FAFC]">
            <Highlighter className="w-3.5 h-3.5 text-[#5A6B8C] mr-0.5" />
            {[
              { id: 'yellow', bg: 'bg-[#FFE66D]', ring: 'ring-[#D97706]' },
              { id: 'blue', bg: 'bg-[#93C5FD]', ring: 'ring-[#2563EB]' },
              { id: 'pink', bg: 'bg-[#F9A8D4]', ring: 'ring-[#DB2777]' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setHlColor((prev) => (prev === c.id ? null : c.id))}
                title={`Highlight ${c.id} (select passage text)`}
                className={`w-5 h-5 rounded-full ${c.bg} border border-[#1B2A4A]/30 cursor-pointer transition-transform ${
                  hlColor === c.id ? `scale-115 ring-2 ${c.ring}` : 'opacity-80 hover:opacity-100'
                }`}
              />
            ))}
            {qHighlights.length > 0 && (
              <button
                onClick={() => onClearHighlights(currentUid)}
                title="Clear highlights on this passage"
                className="ml-0.5 p-1 rounded-lg hover:bg-[#E2E8F0] text-[#64748B] cursor-pointer"
              >
                <Eraser className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Font size cycle */}
          <button
            onClick={() =>
              setFontScale((s) => (s === 'sm' ? 'md' : s === 'md' ? 'lg' : 'sm'))
            }
            title="Cycle reading text size"
            className="bb-btn hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border-2 border-[#DCE4F3] bg-white text-xs font-extrabold text-[#334155] cursor-pointer"
          >
            <Type className="w-3.5 h-3.5" />
            <span className="uppercase">{fontScale}</span>
          </button>

          {/* Eliminator toggle (ABC) */}
          {!isChecked && (
            <button
              onClick={() => setEliminatorMode((v) => !v)}
              title="Toggle Answer Eliminator Mode (Shortcut: E)"
              className={`bb-btn inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border-2 text-xs font-extrabold cursor-pointer ${
                eliminatorMode
                  ? 'bg-[#17233C] text-white border-[#17233C] shadow-[0_2px_0_#0B1221]'
                  : 'bg-white text-[#334155] border-[#DCE4F3] hover:border-[#93B4F8]'
              }`}
            >
              <span className="line-through decoration-2">ABC</span>
            </button>
          )}

          {/* Save Bookmark */}
          <button
            onClick={() => onToggleBookmark(currentUid)}
            title="Save to Bookmarks"
            className={`bb-btn p-2 rounded-xl border-2 cursor-pointer ${
              isBookmarked
                ? 'bg-[#FFFBEB] border-[#F59E0B] text-[#D97706]'
                : 'bg-white border-[#DCE4F3] text-[#64748B] hover:text-[#17233C]'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </header>

      {/* Bluebook Dashed Header Strip */}
      <div className="bg-[#EEF4FF] border-b border-[#D6E2F8] px-4 sm:px-6 py-1.5 shrink-0 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-bold text-[#284B9E]">
          <span>{question.sectionTitle}</span>
          <span className="text-[#94A3B8]">•</span>
          <span className="text-[#475569]">{question.subSkill}</span>
        </div>
        {hlColor ? (
          <div className="flex items-center gap-1.5 text-[#1E3A8A] font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Highlighter active ({hlColor}) — drag across passage text</span>
          </div>
        ) : (
          <span className="hidden sm:inline text-[#64748B] font-semibold">
            ID: {question.id}
          </span>
        )}
      </div>

      {/* Directions Popover */}
      {showDirections && (
        <div className="bg-white border-b-2 border-[#BFD3FA] px-6 py-4 text-sm text-[#334155] shadow-md z-20 shrink-0">
          <div className="max-w-4xl mx-auto flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="font-extrabold text-[#17233C] flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#3B6EF6]" />
                <span>Reading and Writing Directions</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-[#475569]">
                The questions in this section address a number of important reading and writing skills.
                Each question includes one or more passages, which may include a table or graph.
                Read each passage and question carefully, and then choose the best answer to the
                question based on the passage(s). All questions in this section are multiple-choice
                with four answer choices.
              </p>
            </div>
            <button
              onClick={() => setShowDirections(false)}
              className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Split-Pane Workspace */}
      <main
        className={`flex-1 min-h-0 grid grid-cols-1 divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-[#DCE4F3] bg-white ${
          starkaOpen && isChecked && selected !== question.correctAnswer
            ? 'lg:grid-cols-[1.05fr_1fr_380px] xl:grid-cols-[1.1fr_1fr_420px]'
            : 'lg:grid-cols-2'
        }`}
      >
        {/* LEFT PANE: Stimulus / Passage / Figure */}
        <section
          ref={passageRef}
          onMouseUp={handlePassageMouseUp}
          className={`overflow-y-auto px-5 sm:px-9 py-6 sm:py-8 bg-[#FCFDFE] ${
            hlColor ? 'cursor-text' : ''
          }`}
        >
          <div className="max-w-2xl mx-auto space-y-4">
            {question.figure && (
              <div className="mb-5 p-3 rounded-2xl border-2 border-[#DCE4F3] bg-white shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]">
                    Figure / Data Reference
                  </span>
                  <button
                    onClick={() => setZoomImg(question.figure)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#284B9E] hover:underline cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Zoom</span>
                  </button>
                </div>
                <img
                  src={question.figure}
                  alt="SAT question chart or table"
                  onClick={() => setZoomImg(question.figure)}
                  className="max-h-96 mx-auto object-contain cursor-zoom-in rounded-lg"
                />
              </div>
            )}

            <div className={`font-reading text-[#17233C] space-y-4 ${fontSizeClass}`}>
              {question.blocks.map((blk, bIdx) => {
                if (blk.type === 'heading') {
                  return (
                    <div
                      key={bIdx}
                      className="pt-2 first:pt-0 font-sans text-xs font-extrabold uppercase tracking-widest text-[#284B9E] flex items-center gap-2"
                    >
                      <span className="px-2.5 py-1 rounded-lg bg-[#EEF4FF] border border-[#C7D7FA]">
                        {blk.text}
                      </span>
                      <div className="flex-1 h-px bg-[#E2E8F0]" />
                    </div>
                  );
                }
                if (blk.type === 'poem') {
                  return (
                    <blockquote
                      key={bIdx}
                      className="pl-5 border-l-4 border-[#93B4F8] bg-[#F6F9FF] py-3 pr-4 rounded-r-xl leading-[1.9]"
                    >
                      <RichSegments
                        segments={blk.segments}
                        highlights={qHighlights}
                        onRemoveHighlight={(hid) => onRemoveHighlight(currentUid, hid)}
                      />
                    </blockquote>
                  );
                }
                if (blk.type === 'quote') {
                  return (
                    <blockquote
                      key={bIdx}
                      className="pl-5 border-l-4 border-[#CBD5E1] text-[#1E293B]"
                    >
                      <RichSegments
                        segments={blk.segments}
                        highlights={qHighlights}
                        onRemoveHighlight={(hid) => onRemoveHighlight(currentUid, hid)}
                      />
                    </blockquote>
                  );
                }
                return (
                  <p key={bIdx}>
                    <RichSegments
                      segments={blk.segments}
                      highlights={qHighlights}
                      onRemoveHighlight={(hid) => onRemoveHighlight(currentUid, hid)}
                    />
                  </p>
                );
              })}
            </div>

            {question.attribution && (
              <div className="pt-2 text-right text-xs text-[#64748B] font-medium">
                {question.attribution}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT PANE: Question & Answer Choices */}
        <section className="overflow-y-auto px-5 sm:px-9 py-6 sm:py-8 bg-white">
          <div className="max-w-xl mx-auto">
            {/* Bluebook Question Number Bar */}
            <div className="mb-4">
              <div className="bb-dashed-rule mb-3 opacity-80" />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-[#17233C] text-white font-extrabold text-sm flex items-center justify-center">
                    {session.currentIndex + 1}
                  </span>
                  <button
                    onClick={() => onToggleSessionFlag(currentUid)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-bold cursor-pointer transition-colors ${
                      isFlagged
                        ? 'bg-[#FFF1F2] border-[#FDA4AF] text-[#BE123C]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current' : ''}`} />
                    <span>{isFlagged ? 'Marked for Review' : 'Mark for Review'}</span>
                  </button>
                </div>

                {eliminatorMode && !isChecked && (
                  <span className="px-2.5 py-1 rounded-lg bg-[#17233C] text-white text-[11px] font-bold">
                    Click choice to cross out
                  </span>
                )}
              </div>
              <div className="bb-dashed-rule mt-3 opacity-80" />
            </div>

            {/* Question Stem */}
            <div className="text-[16px] sm:text-[17px] font-semibold text-[#17233C] leading-relaxed mb-5">
              <RichSegments segments={question.prompt} inline={false} />
            </div>

            {/* Answer Choices A-D */}
            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map((letter) => {
                const isSelected = selected === letter;
                const isCorrectOpt = question.correctAnswer === letter;
                const isEliminated = eliminated.includes(letter);

                let cardStyle =
                  'bg-white border-[#CBD5E1] hover:border-[#3B6EF6] shadow-[0_3px_0_#E2E8F0]';
                let badgeStyle = 'bg-white text-[#17233C] border-[#17233C]';

                if (isChecked) {
                  if (isCorrectOpt) {
                    cardStyle =
                      'bg-[#ECFDF5] border-[#10B981] shadow-[0_3px_0_#A7F3D0]';
                    badgeStyle = 'bg-[#10B981] text-white border-[#059669]';
                  } else if (isSelected && !isCorrectOpt) {
                    cardStyle =
                      'bg-[#FFF1F2] border-[#F43F5E] shadow-[0_3px_0_#FECDD3]';
                    badgeStyle = 'bg-[#F43F5E] text-white border-[#E11D48]';
                  } else {
                    cardStyle = 'bg-[#F8FAFC] border-[#E2E8F0] opacity-70';
                    badgeStyle = 'bg-[#F1F5F9] text-[#64748B] border-[#CBD5E1]';
                  }
                } else if (isEliminated) {
                  cardStyle = 'bg-[#F8FAFC] border-[#E2E8F0] opacity-55';
                  badgeStyle = 'bg-[#E2E8F0] text-[#64748B] border-[#94A3B8]';
                } else if (isSelected) {
                  cardStyle =
                    'bg-[#EEF4FF] border-[#284B9E] shadow-[0_3px_0_#93B4F8]';
                  badgeStyle = 'bg-[#284B9E] text-white border-[#1B2A4A]';
                }

                return (
                  <div key={letter} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOptionClick(letter)}
                      disabled={isChecked || (isEliminated && !eliminatorMode)}
                      className={`bb-btn flex-1 text-left p-3.5 sm:p-4 rounded-2xl border-2 flex items-start gap-3.5 transition-all ${cardStyle} ${
                        isChecked ? 'cursor-default' : 'cursor-pointer'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-full border-2 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 ${badgeStyle}`}
                      >
                        {letter}
                      </span>

                      <span
                        className={`flex-1 text-[15px] sm:text-[16px] leading-relaxed font-medium text-[#17233C] ${
                          isEliminated && !isChecked ? 'line-through decoration-2 text-[#64748B]' : ''
                        }`}
                      >
                        <RichSegments segments={question.choices[letter]} inline={false} />
                      </span>

                      {isChecked && isCorrectOpt && (
                        <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
                      )}
                      {isChecked && isSelected && !isCorrectOpt && (
                        <XCircle className="w-5 h-5 text-[#F43F5E] shrink-0 mt-0.5" />
                      )}
                    </button>

                    {/* Quick per-choice eliminate button */}
                    {!isChecked && (
                      <button
                        type="button"
                        onClick={() => onToggleEliminate(currentUid, letter)}
                        title={isEliminated ? `Restore ${letter}` : `Eliminate ${letter}`}
                        className={`w-8 h-8 rounded-xl border-2 text-xs font-extrabold flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                          isEliminated
                            ? 'bg-[#17233C] text-white border-[#17233C]'
                            : 'bg-white text-[#94A3B8] border-[#E2E8F0] hover:text-[#475569] hover:border-[#CBD5E1]'
                        }`}
                      >
                        <span className="line-through">{letter}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Practice Mode: Check Answer & Instant Feedback */}
            {session.mode === 'practice' && !isChecked && (
              <div className="mt-6 flex items-center justify-between gap-3">
                <span className="text-xs text-[#64748B] font-semibold">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-[#F1F5F9] border border-[#CBD5E1]">A–D</kbd> to choose, <kbd className="px-1.5 py-0.5 rounded bg-[#F1F5F9] border border-[#CBD5E1]">Enter</kbd> to check
                </span>
                <button
                  onClick={() => selected && onCheckAnswer(currentUid)}
                  disabled={!selected}
                  className="bb-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3B6EF6] hover:bg-[#2E5CE0] text-white font-extrabold text-sm border-2 border-[#1B2A4A] shadow-[0_3px_0_#1B2A4A] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Check Answer</span>
                </button>
              </div>
            )}

            {isChecked && (
              <div
                className={`mt-6 p-4 rounded-2xl border-2 flex items-center justify-between gap-3 ${
                  selected === question.correctAnswer
                    ? 'bg-[#ECFDF5] border-[#6EE7B7] text-[#065F46]'
                    : 'bg-[#FFF1F2] border-[#FDA4AF] text-[#9F1239]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {selected === question.correctAnswer ? (
                    <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-[#F43F5E] shrink-0" />
                  )}
                  <div>
                    <div className="font-extrabold text-sm">
                      {selected === question.correctAnswer
                        ? 'Correct!'
                        : selected
                        ? `Incorrect — Correct Answer is ${question.correctAnswer}`
                        : `Unanswered — Correct Answer is ${question.correctAnswer}`}
                    </div>
                    <div className="text-xs opacity-85 font-medium">
                      {question.subSkill} • Bank #{question.number}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Starka AI Trigger — opens side panel on the right */}
            {isChecked && selected !== question.correctAnswer && (
              <StarkaTriggerButton
                isOpen={starkaOpen}
                onClick={() => setStarkaOpen((v) => !v)}
              />
            )}
          </div>
        </section>

        {/* RIGHT SIDEBAR: Starka AI Explanation Panel */}
        {starkaOpen && isChecked && selected !== question.correctAnswer && (
          <div className="hidden lg:block h-full min-h-0">
            <StarkaSidePanel
              key={currentUid}
              question={question}
              selectedAnswer={selected || '(none)'}
              onClose={() => setStarkaOpen(false)}
            />
          </div>
        )}
      </main>

      {/* Mobile Starka Drawer (<lg) */}
      {starkaOpen && isChecked && selected !== question.correctAnswer && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-[#17233C]/45 backdrop-blur-[2px] flex justify-end"
          onClick={() => setStarkaOpen(false)}
        >
          <div
            className="w-full max-w-md h-full bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <StarkaSidePanel
              key={`mob-${currentUid}`}
              question={question}
              selectedAnswer={selected || '(none)'}
              onClose={() => setStarkaOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Bottom Bluebook Navigation Footer */}
      <footer className="bg-white border-t-2 border-[#DCE4F3] px-3 sm:px-6 h-16 shrink-0 flex items-center justify-between gap-3 z-30">
        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-[#5A6B8C]">
          <span>
            {answeredCount} / {total} answered
          </span>
        </div>

        {/* Center Question Map Popover Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowMap((v) => !v)}
            className="bb-btn inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#17233C] text-white font-extrabold text-xs sm:text-sm shadow-[0_3px_0_#0B1221] cursor-pointer"
          >
            <span>
              Question {session.currentIndex + 1} of {total}
            </span>
            {showMap ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {showMap && (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-[320px] sm:w-[440px] bg-white border-2 border-[#1B2A4A] rounded-3xl shadow-[0_8px_0_#1B2A4A] p-5 z-50">
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#EEF2FA]">
                <div>
                  <h4 className="font-extrabold text-sm text-[#17233C]">{session.title}</h4>
                  <p className="text-[11px] font-semibold text-[#64748B]">
                    Jump to any question
                  </p>
                </div>
                <button
                  onClick={() => setShowMap(false)}
                  className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 py-2.5 text-[11px] font-bold text-[#475569]">
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-[#3B6EF6] inline-block" /> Answered
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded border-2 border-dashed border-[#64748B] inline-block" />{' '}
                  Unanswered
                </span>
                <span className="inline-flex items-center gap-1">
                  <Flag className="w-3 h-3 text-[#E11D48] fill-current" /> Marked
                </span>
              </div>

              <div className="grid grid-cols-7 sm:grid-cols-9 gap-2 max-h-60 overflow-y-auto py-2">
                {session.questionUids.map((uid, idx) => {
                  const ans = session.answers[uid];
                  const qObj = questionMap[uid];
                  const flagged = session.flagged.includes(uid);
                  const isCur = idx === session.currentIndex;
                  const checkedThis = isReview || session.checked[uid];

                  let cls =
                    'bg-white text-[#334155] border-2 border-dashed border-[#CBD5E1] hover:border-[#3B6EF6]';
                  if (checkedThis) {
                    if (ans === qObj.correctAnswer) {
                      cls = 'bg-[#ECFDF5] text-[#059669] border-2 border-[#10B981]';
                    } else {
                      cls = 'bg-[#FFF1F2] text-[#E11D48] border-2 border-[#F43F5E]';
                    }
                  } else if (ans) {
                    cls = 'bg-[#3B6EF6] text-white border-2 border-[#284B9E]';
                  }

                  return (
                    <button
                      key={uid}
                      onClick={() => {
                        onNavigate(idx);
                        setShowMap(false);
                      }}
                      className={`relative h-9 rounded-xl font-extrabold text-xs flex items-center justify-center cursor-pointer ${cls} ${
                        isCur ? 'ring-2 ring-offset-2 ring-[#FFBE3B]' : ''
                      }`}
                    >
                      {idx + 1}
                      {flagged && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#E11D48] border border-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Back / Next / Finish */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate(session.currentIndex - 1)}
            disabled={session.currentIndex === 0}
            className="bb-btn inline-flex items-center gap-1 px-3 sm:px-4 py-2 rounded-xl border-2 border-[#D9E2F2] bg-white text-[#17233C] font-bold text-xs sm:text-sm shadow-[0_2px_0_#D9E2F2] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {session.currentIndex < total - 1 ? (
            <button
              onClick={() => onNavigate(session.currentIndex + 1)}
              className="bb-btn inline-flex items-center gap-1 px-4 sm:px-5 py-2 rounded-xl bg-[#3B6EF6] hover:bg-[#2E5CE0] text-white font-extrabold text-xs sm:text-sm border-2 border-[#1B2A4A] shadow-[0_3px_0_#1B2A4A] cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : isReview ? (
            <button
              onClick={onOpenResults}
              className="bb-btn inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-[#FFBE3B] text-[#17233C] font-extrabold text-xs sm:text-sm border-2 border-[#1B2A4A] shadow-[0_3px_0_#1B2A4A] cursor-pointer"
            >
              <span>Back to Results</span>
            </button>
          ) : (
            <button
              onClick={() => setConfirmSubmit(true)}
              className="bb-btn inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-xs sm:text-sm border-2 border-[#1B2A4A] shadow-[0_3px_0_#1B2A4A] cursor-pointer"
            >
              <span>Finish &amp; Grade</span>
            </button>
          )}

          {!isReview && session.currentIndex < total - 1 && (
            <button
              onClick={() => setConfirmSubmit(true)}
              className="hidden md:inline-flex items-center px-3 py-2 rounded-xl border-2 border-[#DCE4F3] bg-[#F8FAFC] hover:bg-[#EEF4FF] text-[#284B9E] font-bold text-xs cursor-pointer"
            >
              Finish
            </button>
          )}

          {isReview && session.currentIndex < total - 1 && (
            <button
              onClick={onOpenResults}
              className="hidden md:inline-flex items-center px-3 py-2 rounded-xl border-2 border-[#FCD34D] bg-[#FFFBEB] text-[#92400E] font-bold text-xs cursor-pointer"
            >
              Results
            </button>
          )}
        </div>
      </footer>

      {/* Finish / Submit Confirmation Modal */}
      {confirmSubmit && (
        <div
          className="fixed inset-0 z-50 bg-[#17233C]/45 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => setConfirmSubmit(false)}
        >
          <div
            className="bg-white border-2 border-[#1B2A4A] rounded-3xl shadow-[0_8px_0_#1B2A4A] max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-extrabold text-[#17233C]">Finish this session?</h3>
            <p className="text-sm text-[#5A6B8C] leading-relaxed">
              You have answered{' '}
              <strong className="text-[#17233C]">
                {answeredCount} of {total}
              </strong>{' '}
              questions.
              {answeredCount < total &&
                ` ${total - answeredCount} unanswered question${
                  total - answeredCount === 1 ? '' : 's'
                } will be marked incorrect.`}
              {session.flagged.length > 0 &&
                ` You have ${session.flagged.length} marked for review.`}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmSubmit(false)}
                className="bb-btn px-4 py-2 rounded-xl border-2 border-[#D9E2F2] bg-white text-[#334155] font-bold text-sm cursor-pointer"
              >
                Keep Solving
              </button>
              <button
                onClick={() => {
                  setConfirmSubmit(false);
                  onSubmitSession();
                }}
                className="bb-btn px-5 py-2 rounded-xl bg-[#10B981] text-white font-extrabold text-sm border-2 border-[#1B2A4A] shadow-[0_3px_0_#1B2A4A] cursor-pointer"
              >
                Submit &amp; Score
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Figure Zoom Lightbox */}
      {zoomImg && (
        <div
          className="fixed inset-0 z-50 bg-[#17233C]/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setZoomImg(null)}
        >
          <div
            className="bg-white rounded-3xl border-2 border-[#1B2A4A] p-4 max-w-3xl w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomImg(null)}
              className="absolute top-3 right-3 p-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#17233C] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomImg}
              alt="Zoomed SAT figure"
              className="max-h-[82vh] mx-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

