import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Lightbulb,
  SpellCheck,
  Sparkles,
  Play,
  Shuffle,
  Clock,
  Bookmark,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  SlidersHorizontal,
  X,
  ArrowRight,
  Layers,
  Target,
  BarChart3,
  Zap,
  Plus,
  Upload,
  FileText,
  Trash2,
  FolderPlus,
  Loader2,
} from 'lucide-react';
import { BrandMascot } from './LogoMascot';

const THEME_STYLES = {
  blue: {
    accentBg: 'bg-[#EEF4FF]',
    accentText: 'text-[#284B9E]',
    accentBorder: 'border-[#BFD3FA]',
    barColor: 'bg-[#3B6EF6]',
    barLight: 'bg-[#DBEAFE]',
    hex: '#3B6EF6',
  },
  emerald: {
    accentBg: 'bg-[#ECFDF5]',
    accentText: 'text-[#047857]',
    accentBorder: 'border-[#A7F3D0]',
    barColor: 'bg-[#10B981]',
    barLight: 'bg-[#D1FAE5]',
    hex: '#10B981',
  },
  red: {
    accentBg: 'bg-[#FFF1F2]',
    accentText: 'text-[#BE123C]',
    accentBorder: 'border-[#FECDD3]',
    barColor: 'bg-[#F43F5E]',
    barLight: 'bg-[#FFE4E6]',
    hex: '#F43F5E',
  },
  purple: {
    accentBg: 'bg-[#F3EEFF]',
    accentText: 'text-[#5B21B6]',
    accentBorder: 'border-[#D8C7FC]',
    barColor: 'bg-[#7C3AED]',
    barLight: 'bg-[#EDE9FE]',
    hex: '#7C3AED',
  },
  amber: {
    accentBg: 'bg-[#FFFBEB]',
    accentText: 'text-[#B45309]',
    accentBorder: 'border-[#FDE68A]',
    barColor: 'bg-[#F59E0B]',
    barLight: 'bg-[#FEF3C7]',
    hex: '#F59E0B',
  },
};

const SECTION_META = [
  {
    id: 'craft',
    title: 'Craft and Structure',
    subtitle: 'Words in Context, Text Structure & Purpose, Cross-Text Connections',
    theme: 'blue',
    icon: BookOpen,
  },
  {
    id: 'info',
    title: 'Information and Ideas',
    subtitle: 'Central Ideas, Inferences, Textual & Quantitative Evidence',
    theme: 'emerald',
    icon: Lightbulb,
  },
  {
    id: 'english',
    title: 'Standard English Conventions',
    subtitle: 'Sentence Structure, Punctuation, Boundaries & Grammar Usage',
    theme: 'red',
    icon: SpellCheck,
  },
];

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function SectionProgressBar({ stats, theme = 'blue' }) {
  const style = THEME_STYLES[theme] || THEME_STYLES.blue;
  const total = stats.total || 0;
  const solvedPct = total > 0 ? Math.round((stats.answered / total) * 100) : 0;
  const wrongCount = Math.max(0, stats.answered - stats.correct);
  const points = stats.points || [];

  // SVG coordinate system
  const W = 280;
  const H = 104;
  const padL = 30;
  const padR = 12;
  const padT = 12;
  const padB = 22;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const maxX = Math.max(points.length, 4);
  const coords = points.map((pt, idx) => {
    const x = padL + ((idx + 1) / maxX) * plotW;
    const y = padT + (1 - pt.acc / 100) * plotH;
    return { ...pt, x, y, num: idx + 1 };
  });

  // Start line at (padL, baseline) if there are points
  const linePoints =
    coords.length > 0
      ? `${padL},${padT + plotH} ` + coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
      : '';

  const areaPath =
    coords.length > 0
      ? `M ${padL},${padT + plotH} ` +
        coords.map((c) => `L ${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ') +
        ` L ${coords[coords.length - 1].x.toFixed(1)},${padT + plotH} Z`
      : '';

  const gradId = `grad-${theme}-${total}`;

  return (
    <div className="mt-3 px-4 py-3.5 rounded-2xl bg-white border-2 border-[#D9E2F2] shadow-[0_3px_0_#D9E2F2]">
      <div className="flex items-center justify-between text-xs font-extrabold mb-2">
        <span className="text-[#17233C] flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${style.barColor}`} />
          <span>
            {stats.answered} / {total} solved ({solvedPct}%)
          </span>
        </span>
        <span
          className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
            stats.accuracy !== null
              ? `${style.accentBg} ${style.accentText}`
              : 'bg-[#F1F5F9] text-[#94A3B8]'
          }`}
        >
          {stats.accuracy !== null ? `${stats.accuracy}% acc` : '0%'}
        </span>
      </div>

      {/* 2-Axis Function Line Chart */}
      <div className="w-full">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={style.hex} stopOpacity="0.22" />
              <stop offset="100%" stopColor={style.hex} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Horizontal dashed gridlines (100%, 50%) */}
          <line
            x1={padL}
            y1={padT}
            x2={W - padR}
            y2={padT}
            stroke="#E2E8F0"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <line
            x1={padL}
            y1={padT + plotH / 2}
            x2={W - padR}
            y2={padT + plotH / 2}
            stroke="#E2E8F0"
            strokeDasharray="3 3"
            strokeWidth="1"
          />

          {/* Y-axis & X-axis */}
          <line
            x1={padL}
            y1={padT - 2}
            x2={padL}
            y2={padT + plotH}
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1={padL}
            y1={padT + plotH}
            x2={W - padR + 2}
            y2={padT + plotH}
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Y-axis labels */}
          <text x={padL - 5} y={padT + 3} textAnchor="end" fontSize="8.5" fontWeight="700" fill="#94A3B8">
            100%
          </text>
          <text
            x={padL - 5}
            y={padT + plotH / 2 + 3}
            textAnchor="end"
            fontSize="8.5"
            fontWeight="700"
            fill="#94A3B8"
          >
            50%
          </text>
          <text x={padL - 5} y={padT + plotH + 3} textAnchor="end" fontSize="8.5" fontWeight="700" fill="#94A3B8">
            0%
          </text>

          {/* X-axis tick labels */}
          <text x={padL} y={H - 5} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#94A3B8">
            0
          </text>
          <text
            x={padL + plotW / 2}
            y={H - 5}
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="700"
            fill="#94A3B8"
          >
            {Math.round(maxX / 2)}
          </text>
          <text x={W - padR} y={H - 5} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#94A3B8">
            {maxX} Qs
          </text>

          {/* Area & Function Line */}
          {coords.length > 0 ? (
            <>
              <path d={areaPath} fill={`url(#${gradId})`} />
              <polyline
                fill="none"
                stroke={style.hex}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={linePoints}
              />
              <circle cx={padL} cy={padT + plotH} r="2.5" fill="#94A3B8" />
              {coords.map((c) => (
                <circle
                  key={c.num}
                  cx={c.x}
                  cy={c.y}
                  r="3.8"
                  fill={c.isCorrect ? style.hex : '#FFFFFF'}
                  stroke={style.hex}
                  strokeWidth="2"
                >
                  <title>{`Q${c.num}: ${c.isCorrect ? 'Correct' : 'Wrong'} (${c.acc}% acc)`}</title>
                </circle>
              ))}
            </>
          ) : (
            <text
              x={padL + plotW / 2}
              y={padT + plotH / 2 + 3}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="#94A3B8"
            >
              Solve questions to plot progress
            </text>
          )}
        </svg>
      </div>

      {stats.answered > 0 && (
        <div className="mt-1.5 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] font-bold text-[#64748B]">
          <span className="inline-flex items-center gap-1 text-[#059669]">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            {stats.correct} correct
          </span>
          <span className="inline-flex items-center gap-1 text-[#E11D48]">
            <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />
            {wrongCount} wrong
          </span>
        </div>
      )}
    </div>
  );
}

export function HomeHub({
  baseQuestions,
  allQuestions,
  customPacks,
  onUpdateCustomPacks,
  history,
  bookmarks,
  activeSession,
  onResumeSession,
  onStartSession,
  onResetProgress,
}) {
  // Config modal state: either { kind: 'base', id } or { kind: 'custom', pack }
  const [configTarget, setConfigTarget] = useState(null);
  const [subSkillFilter, setSubSkillFilter] = useState('ALL');
  const [poolFilter, setPoolFilter] = useState('all');
  const [countLimit, setCountLimit] = useState('ALL');
  const [orderMode, setOrderMode] = useState('ordered');
  const [studyMode, setStudyMode] = useState('practice');
  const [timed, setTimed] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Add Custom Pack modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [packTitle, setPackTitle] = useState('');
  const [packSubtitle, setPackSubtitle] = useState('');
  const [packTheme, setPackTheme] = useState('blue');
  const [questionsPdf, setQuestionsPdf] = useState(null);
  const [answersPdf, setAnswersPdf] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');

  const overallStats = useMemo(() => {
    const total = allQuestions.length;
    let answered = 0;
    let correct = 0;
    let mistakes = 0;
    allQuestions.forEach((q) => {
      const h = history[q.uid];
      if (h) {
        answered += 1;
        if (h.isCorrect) correct += 1;
        else mistakes += 1;
      }
    });
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    return { total, answered, correct, mistakes, accuracy, bookmarked: bookmarks.length };
  }, [allQuestions, history, bookmarks]);

  const computeStatsForList = (qs) => {
    let answered = 0;
    let correct = 0;
    const subSkills = {};
    const attempts = [];
    qs.forEach((q) => {
      subSkills[q.subSkill] = (subSkills[q.subSkill] || 0) + 1;
      const h = history[q.uid];
      if (h) {
        answered += 1;
        if (h.isCorrect) correct += 1;
        attempts.push({
          uid: q.uid,
          isCorrect: Boolean(h.isCorrect),
          updatedAt: h.updatedAt || 0,
        });
      }
    });
    attempts.sort((a, b) => a.updatedAt - b.updatedAt);
    let cumCorrect = 0;
    const points = attempts.map((att, idx) => {
      if (att.isCorrect) cumCorrect += 1;
      return {
        isCorrect: att.isCorrect,
        acc: Math.round((cumCorrect / (idx + 1)) * 100),
      };
    });
    return {
      total: qs.length,
      answered,
      correct,
      accuracy: answered > 0 ? Math.round((correct / answered) * 100) : null,
      subSkills,
      points,
    };
  };

  const baseSectionStats = useMemo(() => {
    const map = {};
    SECTION_META.forEach((sec) => {
      map[sec.id] = computeStatsForList(baseQuestions.filter((q) => q.section === sec.id));
    });
    return map;
  }, [baseQuestions, history]);

  const customPackStats = useMemo(() => {
    const map = {};
    customPacks.forEach((pack) => {
      map[pack.id] = computeStatsForList(pack.questions || []);
    });
    return map;
  }, [customPacks, history]);

  const openSectionModal = (target) => {
    setConfigTarget(target);
    setSubSkillFilter('ALL');
    setPoolFilter('all');
    if (target.id === 'mixed') {
      setCountLimit(27);
      setOrderMode('shuffled');
      setStudyMode('exam');
      setTimed(true);
    } else {
      setCountLimit('ALL');
      setOrderMode('ordered');
      setStudyMode('practice');
      setTimed(false);
    }
  };

  const previewMatchingQuestions = useMemo(() => {
    if (!configTarget) return [];
    let list = [];
    if (configTarget.kind === 'mixed') {
      list = [...baseQuestions];
    } else if (configTarget.kind === 'base') {
      list = baseQuestions.filter((q) => q.section === configTarget.id);
    } else if (configTarget.kind === 'custom') {
      list = [...(configTarget.pack.questions || [])];
    }

    if (subSkillFilter !== 'ALL') {
      list = list.filter((q) => q.subSkill === subSkillFilter);
    }
    if (poolFilter === 'unsolved') {
      list = list.filter((q) => !history[q.uid]);
    } else if (poolFilter === 'mistakes') {
      list = list.filter((q) => history[q.uid] && !history[q.uid].isCorrect);
    } else if (poolFilter === 'bookmarked') {
      list = list.filter((q) => bookmarks.includes(q.uid));
    }
    return list;
  }, [configTarget, baseQuestions, subSkillFilter, poolFilter, history, bookmarks]);

  const handleLaunchConfigured = () => {
    let list = [...previewMatchingQuestions];
    if (list.length === 0) return;

    if (orderMode === 'shuffled') {
      if (
        configTarget.kind === 'mixed' &&
        countLimit === 27 &&
        poolFilter === 'all' &&
        subSkillFilter === 'ALL'
      ) {
        const c = shuffleArray(list.filter((q) => q.section === 'craft')).slice(0, 12);
        const i = shuffleArray(list.filter((q) => q.section === 'info')).slice(0, 8);
        const e = shuffleArray(list.filter((q) => q.section === 'english')).slice(0, 7);
        list = [...c, ...i, ...e];
      } else {
        list = shuffleArray(list);
      }
    }

    if (countLimit !== 'ALL') {
      list = list.slice(0, Number(countLimit));
    }

    let title = 'Verbal Practice';
    if (configTarget.kind === 'mixed') title = 'SAT Verbal Mixed Module';
    else if (configTarget.kind === 'base') {
      title = SECTION_META.find((s) => s.id === configTarget.id)?.title || title;
    } else if (configTarget.kind === 'custom') {
      title = configTarget.pack.title;
    }

    const subtitle =
      subSkillFilter !== 'ALL'
        ? subSkillFilter
        : poolFilter === 'mistakes'
        ? 'Mistake Review'
        : poolFilter === 'bookmarked'
        ? 'Saved Questions'
        : `${list.length} Questions`;

    const durationSec = timed
      ? list.length === 27
        ? 32 * 60
        : Math.max(60, Math.round(list.length * 71))
      : 0;

    onStartSession({
      title,
      subtitle,
      mode: studyMode,
      timed,
      durationSec,
      questionUids: list.map((q) => q.uid),
    });
    setConfigTarget(null);
  };

  const launchQuickPool = (type) => {
    const list =
      type === 'mistakes'
        ? allQuestions.filter((q) => history[q.uid] && !history[q.uid].isCorrect)
        : allQuestions.filter((q) => bookmarks.includes(q.uid));
    if (list.length === 0) return;
    onStartSession({
      title: type === 'mistakes' ? 'Mistake Drill' : 'Saved Bookmarks',
      subtitle: `${list.length} Questions`,
      mode: 'practice',
      timed: false,
      durationSec: 0,
      questionUids: list.map((q) => q.uid),
    });
  };

  const handleImportPack = async (e) => {
    e.preventDefault();
    if (!packTitle.trim() || !questionsPdf || !answersPdf) {
      setImportError('Заполни название и прикрепи оба PDF (задания и ответы).');
      return;
    }
    setImporting(true);
    setImportError('');
    try {
      const [questionsPdfBase64, answersPdfBase64] = await Promise.all([
        fileToBase64(questionsPdf),
        fileToBase64(answersPdf),
      ]);
      const res = await fetch('/api/import-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: packTitle.trim(),
          subtitle: packSubtitle.trim(),
          theme: packTheme,
          questionsPdfBase64,
          answersPdfBase64,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }
      onUpdateCustomPacks(data.packs);
      setShowAddModal(false);
      setPackTitle('');
      setPackSubtitle('');
      setQuestionsPdf(null);
      setAnswersPdf(null);
    } catch (err) {
      setImportError(err.message || 'Failed to import PDFs');
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteCustomPack = async (e, packId) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/delete-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      });
      const data = await res.json();
      if (res.ok && data.packs) {
        onUpdateCustomPacks(data.packs);
      }
    } catch {
      // ignore
    }
  };

  const modalTitle =
    configTarget?.kind === 'mixed'
      ? 'SAT Verbal Mixed Module'
      : configTarget?.kind === 'base'
      ? SECTION_META.find((s) => s.id === configTarget.id)?.title
      : configTarget?.pack?.title || '';

  const subSkillsForModal = useMemo(() => {
    if (!configTarget || configTarget.kind === 'mixed') return [];
    if (configTarget.kind === 'base') {
      return Object.entries(baseSectionStats[configTarget.id]?.subSkills || {});
    }
    return Object.entries(customPackStats[configTarget.pack.id]?.subSkills || {});
  }, [configTarget, baseSectionStats, customPackStats]);

  const finalLaunchCount =
    countLimit === 'ALL'
      ? previewMatchingQuestions.length
      : Math.min(previewMatchingQuestions.length, Number(countLimit));

  return (
    <div className="min-h-screen bg-[#F5F7FC] text-[#17233C]">
      {/* Top Navbar */}
      <header className="bg-white border-b-2 border-[#DCE4F3] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <BrandMascot className="w-9 h-9 sm:w-11 sm:h-11 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-xl font-extrabold tracking-tight text-[#17233C] truncate">
                  Bluebook Studio
                </span>
                <span className="hidden xs:inline-block sm:inline-block px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded-full bg-[#EEF4FF] text-[#284B9E] border border-[#C7D7FA] shrink-0">
                  Verbal
                </span>
              </div>
              <p className="hidden sm:block text-xs text-[#5A6B8C] font-medium">
                Digital SAT Reading &amp; Writing Practice Bank
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => launchQuickPool('mistakes')}
              disabled={overallStats.mistakes === 0}
              className="bb-btn hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 border-[#FCD3D9] bg-[#FFF5F6] text-[#BE123C] text-xs font-bold shadow-[0_2px_0_#F9B8C2] disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Mistakes ({overallStats.mistakes})</span>
            </button>

            <button
              onClick={() => launchQuickPool('bookmarks')}
              disabled={overallStats.bookmarked === 0}
              className="bb-btn inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 border-[#FDE68A] bg-[#FFFBEB] text-[#B45309] text-xs font-bold shadow-[0_2px_0_#FCD34D] disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
            >
              <Bookmark className="w-4 h-4" />
              <span className="hidden sm:inline">Saved</span> ({overallStats.bookmarked})
            </button>

            {overallStats.answered > 0 && (
              <div className="relative">
                {!confirmReset ? (
                  <button
                    onClick={() => setConfirmReset(true)}
                    title="Reset saved progress"
                    className="bb-btn p-2 rounded-xl border-2 border-[#D9E2F2] bg-white text-[#5A6B8C] hover:text-[#17233C] shadow-[0_2px_0_#D9E2F2] cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-white border-2 border-[#FDA4AF] rounded-xl px-2.5 py-1 shadow-md">
                    <span className="text-xs font-bold text-[#BE123C]">Reset?</span>
                    <button
                      onClick={() => {
                        onResetProgress();
                        setConfirmReset(false);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-[#E11D48] text-white text-xs font-bold cursor-pointer"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="px-2 py-0.5 rounded-lg bg-[#E2E8F0] text-[#334155] text-xs font-bold cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-9">
        {/* Resume Banner if active session exists */}
        {activeSession && !activeSession.submitted && (
          <div className="bb-card rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-[#EEF4FF] to-[#F7F9FF] border-[#93B4F8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#3B6EF6] text-white flex items-center justify-center shrink-0 shadow-[0_3px_0_#2449B0]">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#284B9E]">
                  Session in Progress
                </div>
                <div className="text-base font-extrabold text-[#17233C]">
                  {activeSession.title} — Question {activeSession.currentIndex + 1} of{' '}
                  {activeSession.questionUids.length}
                </div>
              </div>
            </div>
            <button
              onClick={onResumeSession}
              className="bb-btn inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#3B6EF6] hover:bg-[#2E5CE0] text-white font-bold text-sm border-2 border-[#1B2A4A] shadow-[0_3px_0_#1B2A4A] cursor-pointer"
            >
              <span>Resume Practice</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Hero / Progress Summary */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bb-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between bg-white relative overflow-hidden">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF7DF] border border-[#FCD34D] text-[#92400E] text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{allQuestions.length} Authentic College Board Verbal Questions</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#17233C] leading-snug">
                Choose a Reading &amp; Writing Part to Practice
              </h1>
              <p className="mt-2 text-sm sm:text-base text-[#526280] leading-relaxed">
                Train in Bluebook split-screen style with passage highlighting, answer eliminator,
                review flags, Starka AI tutor, and real timer controls.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t-2 border-[#EEF2FA] grid grid-cols-3 gap-2 sm:gap-4">
              <div>
                <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Completed
                </div>
                <div className="mt-1 text-xl sm:text-2xl font-extrabold text-[#17233C]">
                  {overallStats.answered}
                  <span className="text-xs sm:text-sm font-bold text-[#8A99B5]"> / {overallStats.total}</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Accuracy
                </div>
                <div className="mt-1 text-xl sm:text-2xl font-extrabold text-[#10B981]">
                  {overallStats.answered > 0 ? `${overallStats.accuracy}%` : '—'}
                </div>
              </div>
              <div>
                <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  To Review
                </div>
                <div className="mt-1 text-xl sm:text-2xl font-extrabold text-[#F59E0B]">
                  {overallStats.mistakes + overallStats.bookmarked}
                </div>
              </div>
            </div>
          </div>

          {/* Mixed Module Quick Launch */}
          <div className="bb-card rounded-3xl p-6 bg-[#1E356B] text-white border-[#14234A] shadow-[0_5px_0_#14234A] flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-[#FDE68A] text-xs font-bold mb-3">
                <Clock className="w-3.5 h-3.5" />
                <span>Real SAT Simulation</span>
              </div>
              <h2 className="text-xl font-extrabold leading-snug">Full Verbal Module</h2>
              <p className="mt-2 text-sm text-[#C7D7FA] leading-relaxed">
                27 mixed questions across all 3 core domains with a 32-minute Bluebook countdown
                timer.
              </p>
            </div>

            <div className="mt-6 space-y-2.5">
              <button
                onClick={() => openSectionModal({ kind: 'mixed', id: 'mixed' })}
                className="bb-btn w-full py-3 px-4 rounded-xl bg-[#FFBE3B] hover:bg-[#F5B025] text-[#17233C] font-extrabold text-sm border-2 border-[#17233C] shadow-[0_3px_0_#17233C] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start 27-Question Module</span>
              </button>
              <div className="flex items-center justify-center gap-3 text-xs text-[#AFC5F6] font-medium">
                <span>12 Craft</span>
                <span>•</span>
                <span>8 Info</span>
                <span>•</span>
                <span>7 Conventions</span>
              </div>
            </div>
          </div>
        </section>

        {/* Core Three Verbal Sections (kept separate from newly added packs) */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-extrabold text-[#17233C] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#3B6EF6]" />
              <span>Verbal Question Banks</span>
            </h2>
            <span className="text-xs font-semibold text-[#64748B]">
              Click any section to start or customize your set
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {SECTION_META.map((sec) => {
              const Icon = sec.icon;
              const style = THEME_STYLES[sec.theme];
              const stats = baseSectionStats[sec.id];

              return (
                <div key={sec.id} className="flex flex-col">
                  <div
                    onClick={() => openSectionModal({ kind: 'base', id: sec.id })}
                    className="bb-card bb-card-hover rounded-3xl p-5 sm:p-6 flex flex-col justify-between cursor-pointer group lg:min-h-[300px]"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl ${style.accentBg} ${style.accentText} border-2 ${style.accentBorder} flex items-center justify-center shrink-0`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="px-3 py-1 rounded-full bg-[#F1F5F9] text-[#334155] text-xs font-extrabold">
                          {stats.total} Questions
                        </span>
                      </div>

                      <h3 className="mt-4 text-xl font-extrabold text-[#17233C] group-hover:text-[#284B9E] transition-colors">
                        {sec.title}
                      </h3>
                      <p className="mt-1.5 text-sm text-[#5A6B8C] leading-relaxed">
                        {sec.subtitle}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {Object.entries(stats.subSkills).map(([skill, count]) => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] font-bold text-[#475569]"
                          >
                            {skill} · {count}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t-2 border-[#EEF2FA] flex items-center justify-between">
                      <span className="text-xs font-bold text-[#284B9E] group-hover:underline">
                        Configure &amp; Practice
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-[#EEF4FF] text-[#284B9E] flex items-center justify-center group-hover:bg-[#3B6EF6] group-hover:text-white transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Dedicated Progress Bar Below Card */}
                  <SectionProgressBar stats={stats} theme={sec.theme} />
                </div>
              );
            })}
          </div>
        </section>

        {/* Custom Added Verbal Packs (separate from the core 3 banks above) */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-extrabold text-[#17233C] flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-[#7C3AED]" />
                <span>Added Question Packs</span>
              </h2>
              <p className="text-xs font-semibold text-[#64748B]">
                New verbal PDFs you import appear here as separate modules without mixing into the core banks above
              </p>
            </div>

            <button
              onClick={() => {
                setImportError('');
                setShowAddModal(true);
              }}
              className="bb-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3B6EF6] hover:bg-[#2E5CE0] text-white font-extrabold text-xs sm:text-sm border-2 border-[#1B2A4A] shadow-[0_3px_0_#1B2A4A] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Verbal Pack</span>
            </button>
          </div>

          {customPacks.length === 0 ? (
            <div
              onClick={() => {
                setImportError('');
                setShowAddModal(true);
              }}
              className="rounded-3xl border-2 border-dashed border-[#BFD3FA] bg-white/70 hover:bg-white p-8 text-center cursor-pointer transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#EEF4FF] text-[#284B9E] border-2 border-[#BFD3FA] flex items-center justify-center mx-auto mb-3">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-base font-extrabold text-[#17233C]">
                No extra packs added yet
              </div>
              <p className="mt-1 text-xs sm:text-sm text-[#5A6B8C] max-w-md mx-auto">
                Click <strong>Add Verbal Pack</strong> to upload a new Questions PDF + Answer Key PDF
                and create a separate practice card right here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
              {customPacks.map((pack) => {
                const style = THEME_STYLES[pack.theme] || THEME_STYLES.blue;
                const stats = customPackStats[pack.id] || {
                  total: 0,
                  answered: 0,
                  correct: 0,
                  accuracy: null,
                  subSkills: {},
                };

                return (
                  <div key={pack.id} className="flex flex-col">
                    <div
                      onClick={() => openSectionModal({ kind: 'custom', id: pack.id, pack })}
                      className="bb-card bb-card-hover rounded-3xl p-6 flex flex-col justify-between cursor-pointer group min-h-[260px]"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div
                            className={`w-12 h-12 rounded-2xl ${style.accentBg} ${style.accentText} border-2 ${style.accentBorder} flex items-center justify-center shrink-0`}
                          >
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-3 py-1 rounded-full bg-[#F1F5F9] text-[#334155] text-xs font-extrabold">
                              {stats.total} Questions
                            </span>
                            <button
                              onClick={(e) => handleDeleteCustomPack(e, pack.id)}
                              title="Delete custom pack"
                              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#E11D48] hover:bg-[#FFF1F2] cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <h3 className="mt-4 text-xl font-extrabold text-[#17233C] group-hover:text-[#284B9E] transition-colors">
                          {pack.title}
                        </h3>
                        <p className="mt-1.5 text-sm text-[#5A6B8C] leading-relaxed">
                          {pack.subtitle}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {Object.entries(stats.subSkills).map(([skill, count]) => (
                            <span
                              key={skill}
                              className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] font-bold text-[#475569]"
                            >
                              {skill} · {count}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t-2 border-[#EEF2FA] flex items-center justify-between">
                        <span className="text-xs font-bold text-[#284B9E] group-hover:underline">
                          Configure &amp; Practice
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-[#EEF4FF] text-[#284B9E] flex items-center justify-center group-hover:bg-[#3B6EF6] group-hover:text-white transition-colors">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    <SectionProgressBar stats={stats} theme={pack.theme} />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Mobile Quick Review Buttons */}
        <div className="sm:hidden flex gap-3">
          <button
            onClick={() => launchQuickPool('mistakes')}
            disabled={overallStats.mistakes === 0}
            className="bb-btn flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border-2 border-[#FCD3D9] bg-[#FFF5F6] text-[#BE123C] text-xs font-bold disabled:opacity-45"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Mistakes ({overallStats.mistakes})</span>
          </button>
          <button
            onClick={() => launchQuickPool('bookmarks')}
            disabled={overallStats.bookmarked === 0}
            className="bb-btn flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border-2 border-[#FDE68A] bg-[#FFFBEB] text-[#B45309] text-xs font-bold disabled:opacity-45"
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved ({overallStats.bookmarked})</span>
          </button>
        </div>
      </main>

      {/* Section Practice Configuration Modal */}
      {configTarget && (
        <div
          className="fixed inset-0 z-50 bg-[#17233C]/45 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => setConfigTarget(null)}
        >
          <div
            className="bg-white border-2 border-[#1B2A4A] rounded-3xl shadow-[0_8px_0_#1B2A4A] max-w-xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 bg-[#F5F8FF] border-b-2 border-[#DCE4F3] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#3B6EF6] text-white flex items-center justify-center border-2 border-[#1B2A4A]">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#17233C]">{modalTitle}</h3>
                  <p className="text-xs text-[#5A6B8C] font-semibold">
                    Customize how you want to solve this part
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfigTarget(null)}
                className="p-2 rounded-xl hover:bg-[#E2E8F0] text-[#475569] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5A6B8C] mb-2">
                  Experience Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setStudyMode('practice')}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      studyMode === 'practice'
                        ? 'border-[#3B6EF6] bg-[#EEF4FF] shadow-[0_3px_0_#93B4F8]'
                        : 'border-[#DCE4F3] bg-white hover:border-[#BFD3FA]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-extrabold text-sm text-[#17233C]">
                      <CheckCircle2 className="w-4 h-4 text-[#3B6EF6]" />
                      <span>Practice Mode</span>
                    </div>
                    <p className="mt-1 text-xs text-[#5A6B8C]">
                      Check each question immediately as you go.
                    </p>
                  </button>

                  <button
                    onClick={() => setStudyMode('exam')}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      studyMode === 'exam'
                        ? 'border-[#3B6EF6] bg-[#EEF4FF] shadow-[0_3px_0_#93B4F8]'
                        : 'border-[#DCE4F3] bg-white hover:border-[#BFD3FA]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-extrabold text-sm text-[#17233C]">
                      <Target className="w-4 h-4 text-[#284B9E]" />
                      <span>Bluebook Exam</span>
                    </div>
                    <p className="mt-1 text-xs text-[#5A6B8C]">
                      Answers locked &amp; graded together at the end.
                    </p>
                  </button>
                </div>
              </div>

              {subSkillsForModal.length > 1 && (
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5A6B8C] mb-2">
                    Topic / Sub-skill
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSubSkillFilter('ALL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 cursor-pointer ${
                        subSkillFilter === 'ALL'
                          ? 'bg-[#17233C] text-white border-[#17233C]'
                          : 'bg-white text-[#475569] border-[#DCE4F3] hover:border-[#93B4F8]'
                      }`}
                    >
                      All Topics
                    </button>
                    {subSkillsForModal.map(([skill, cnt]) => (
                      <button
                        key={skill}
                        onClick={() => setSubSkillFilter(skill)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 cursor-pointer ${
                          subSkillFilter === skill
                            ? 'bg-[#17233C] text-white border-[#17233C]'
                            : 'bg-white text-[#475569] border-[#DCE4F3] hover:border-[#93B4F8]'
                        }`}
                      >
                        {skill} ({cnt})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5A6B8C] mb-2">
                  Question Pool
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'unsolved', label: 'Unsolved' },
                    { id: 'mistakes', label: 'Mistakes' },
                    { id: 'bookmarked', label: 'Saved' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setPoolFilter(item.id)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border-2 cursor-pointer ${
                        poolFilter === item.id
                          ? 'bg-[#EEF4FF] text-[#284B9E] border-[#3B6EF6]'
                          : 'bg-white text-[#475569] border-[#DCE4F3] hover:border-[#93B4F8]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5A6B8C] mb-2">
                    Number of Questions
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['ALL', 10, 15, 27].map((val) => (
                      <button
                        key={val}
                        onClick={() => setCountLimit(val)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 cursor-pointer ${
                          countLimit === val
                            ? 'bg-[#17233C] text-white border-[#17233C]'
                            : 'bg-white text-[#475569] border-[#DCE4F3]'
                        }`}
                      >
                        {val === 'ALL' ? `All (${previewMatchingQuestions.length})` : `${val} Qs`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5A6B8C] mb-2">
                    Order &amp; Timer
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setOrderMode((m) => (m === 'ordered' ? 'shuffled' : 'ordered'))
                      }
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border-2 inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                        orderMode === 'shuffled'
                          ? 'bg-[#EEF4FF] text-[#284B9E] border-[#3B6EF6]'
                          : 'bg-white text-[#475569] border-[#DCE4F3]'
                      }`}
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>{orderMode === 'shuffled' ? 'Shuffled' : 'In Order'}</span>
                    </button>

                    <button
                      onClick={() => setTimed((t) => !t)}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border-2 inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                        timed
                          ? 'bg-[#FFFBEB] text-[#B45309] border-[#F59E0B]'
                          : 'bg-white text-[#475569] border-[#DCE4F3]'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timed ? 'Timed' : 'Untimed'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#F8FAFC] border-t-2 border-[#DCE4F3] flex items-center justify-between gap-4">
              <div className="text-xs font-bold text-[#5A6B8C] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#3B6EF6]" />
                <span>
                  {finalLaunchCount > 0
                    ? `Ready: ${finalLaunchCount} question${finalLaunchCount === 1 ? '' : 's'}`
                    : 'No matching questions in this filter'}
                </span>
              </div>

              <button
                onClick={handleLaunchConfigured}
                disabled={finalLaunchCount === 0}
                className="bb-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3B6EF6] hover:bg-[#2E5CE0] text-white font-extrabold text-sm border-2 border-[#1B2A4A] shadow-[0_3px_0_#1B2A4A] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Session</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Verbal Pack Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-[#17233C]/45 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => !importing && setShowAddModal(false)}
        >
          <form
            onSubmit={handleImportPack}
            className="bg-white border-2 border-[#1B2A4A] rounded-3xl shadow-[0_8px_0_#1B2A4A] max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 bg-[#F5F8FF] border-b-2 border-[#DCE4F3] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#7C3AED] text-white flex items-center justify-center border-2 border-[#1B2A4A]">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#17233C]">Add New Verbal Pack</h3>
                  <p className="text-xs text-[#5A6B8C] font-semibold">
                    Creates a separate card below without changing existing banks
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !importing && setShowAddModal(false)}
                className="p-2 rounded-xl hover:bg-[#E2E8F0] text-[#475569] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5A6B8C] mb-1.5">
                  Pack Title
                </label>
                <input
                  type="text"
                  value={packTitle}
                  onChange={(e) => setPackTitle(e.target.value)}
                  placeholder="e.g. Expression of Ideas / Hard Words Pack 2"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#DCE4F3] focus:border-[#3B6EF6] outline-none text-sm font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5A6B8C] mb-1.5">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={packSubtitle}
                  onChange={(e) => setPackSubtitle(e.target.value)}
                  placeholder="e.g. Transitions, Rhetorical Synthesis & Hard Practice"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#DCE4F3] focus:border-[#3B6EF6] outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5A6B8C] mb-1.5">
                  Card Color
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'blue', label: 'Blue', dot: 'bg-[#3B6EF6]' },
                    { id: 'emerald', label: 'Green', dot: 'bg-[#10B981]' },
                    { id: 'red', label: 'Red', dot: 'bg-[#F43F5E]' },
                    { id: 'purple', label: 'Purple', dot: 'bg-[#7C3AED]' },
                    { id: 'amber', label: 'Amber', dot: 'bg-[#F59E0B]' },
                  ].map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setPackTheme(c.id)}
                      className={`flex-1 py-2 px-3 rounded-xl border-2 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                        packTheme === c.id
                          ? 'border-[#17233C] bg-[#F8FAFC]'
                          : 'border-[#DCE4F3] bg-white text-[#64748B]'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${c.dot}`} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block p-3.5 rounded-2xl border-2 border-dashed border-[#BFD3FA] bg-[#F8FAFF] hover:bg-[#EEF4FF] cursor-pointer transition-colors">
                  <div className="text-xs font-extrabold text-[#284B9E] mb-1">
                    1. Questions PDF
                  </div>
                  <div className="text-[11px] font-semibold text-[#5A6B8C] truncate">
                    {questionsPdf ? questionsPdf.name : 'Choose questionbank PDF...'}
                  </div>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(e) => setQuestionsPdf(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>

                <label className="block p-3.5 rounded-2xl border-2 border-dashed border-[#D8C7FC] bg-[#FAF8FF] hover:bg-[#F3EEFF] cursor-pointer transition-colors">
                  <div className="text-xs font-extrabold text-[#5B21B6] mb-1">
                    2. Answer Key PDF
                  </div>
                  <div className="text-[11px] font-semibold text-[#5A6B8C] truncate">
                    {answersPdf ? answersPdf.name : 'Choose answer key PDF...'}
                  </div>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(e) => setAnswersPdf(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>

              {importError && (
                <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FDA4AF] text-xs font-bold text-[#BE123C]">
                  {importError}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-[#F8FAFC] border-t-2 border-[#DCE4F3] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => !importing && setShowAddModal(false)}
                className="bb-btn px-4 py-2 rounded-xl border-2 border-[#D9E2F2] bg-white text-[#334155] font-bold text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={importing}
                className="bb-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-sm border-2 border-[#1B2A4A] shadow-[0_3px_0_#1B2A4A] disabled:opacity-50 cursor-pointer"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Parsing PDFs...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create Pack</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
