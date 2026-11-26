import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Flag,
  RotateCcw,
  Eye,
  Clock,
  Award,
  BarChart2,
} from 'lucide-react';
import { TrophyOwl } from './LogoMascot';

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export function ResultsScreen({
  session,
  questionMap,
  onReviewQuestion,
  onRetryMistakes,
  onReturnHome,
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'incorrect' | 'correct' | 'flagged'

  const summary = useMemo(() => {
    const items = session.questionUids.map((uid, idx) => {
      const q = questionMap[uid];
      const selected = session.answers[uid] || null;
      const isCorrect = selected === q.correctAnswer;
      const isFlagged = session.flagged.includes(uid);
      return { uid, idx, q, selected, isCorrect, isFlagged };
    });

    const total = items.length;
    const correctCount = items.filter((i) => i.isCorrect).length;
    const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    // Rough scaled RW indicator (200-800) based on accuracy for motivation
    const estScaled = Math.round((200 + (pct / 100) * 600) / 10) * 10;

    const bySkill = {};
    items.forEach((it) => {
      if (!bySkill[it.q.subSkill]) {
        bySkill[it.q.subSkill] = { total: 0, correct: 0 };
      }
      bySkill[it.q.subSkill].total += 1;
      if (it.isCorrect) bySkill[it.q.subSkill].correct += 1;
    });

    return { items, total, correctCount, pct, estScaled, bySkill };
  }, [session, questionMap]);

  const filteredItems = summary.items.filter((it) => {
    if (filter === 'incorrect') return !it.isCorrect;
    if (filter === 'correct') return it.isCorrect;
    if (filter === 'flagged') return it.isFlagged;
    return true;
  });

  const mistakeUids = summary.items.filter((i) => !i.isCorrect).map((i) => i.uid);

  return (
    <div className="min-h-screen bg-[#F5F7FC] text-[#17233C]">
      <header className="bg-white border-b-2 border-[#DCE4F3] sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <button
            onClick={onReturnHome}
            className="bb-btn inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 border-[#D9E2F2] bg-white text-xs sm:text-sm font-bold text-[#17233C] shadow-[0_2px_0_#D9E2F2] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Hub</span>
          </button>

          <div className="text-sm font-extrabold text-[#284B9E] truncate">{session.title}</div>

          {mistakeUids.length > 0 ? (
            <button
              onClick={() => onRetryMistakes(mistakeUids)}
              className="bb-btn inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFBE3B] text-[#17233C] font-extrabold text-xs sm:text-sm border-2 border-[#1B2A4A] shadow-[0_3px_0_#1B2A4A] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Mistakes ({mistakeUids.length})</span>
            </button>
          ) : (
            <div className="w-24" />
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Top Score Card */}
        <section className="bb-card rounded-3xl p-6 sm:p-8 bg-white grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="flex items-center gap-5 md:col-span-2">
            <TrophyOwl className="w-20 h-20 shrink-0" />
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF4FF] text-[#284B9E] text-xs font-extrabold mb-2">
                <Award className="w-3.5 h-3.5" />
                <span>Session Complete</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17233C]">
                {summary.correctCount} out of {summary.total} Correct ({summary.pct}%)
              </h1>
              <p className="mt-1 text-sm text-[#5A6B8C] flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-4 h-4 text-[#3B6EF6]" />
                  Time spent: <strong>{formatDuration(session.elapsedSec)}</strong>
                </span>
                <span>•</span>
                <span>
                  Estimated RW Pace Score: <strong>~{summary.estScaled} / 800</strong>
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => onReviewQuestion(0)}
              className="bb-btn w-full py-3 px-4 rounded-xl bg-[#3B6EF6] hover:bg-[#2E5CE0] text-white font-extrabold text-sm border-2 border-[#1B2A4A] shadow-[0_3px_0_#1B2A4A] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Review Answers in Bluebook</span>
            </button>
            <button
              onClick={onReturnHome}
              className="bb-btn w-full py-2.5 px-4 rounded-xl bg-white text-[#17233C] font-bold text-sm border-2 border-[#D9E2F2] shadow-[0_2px_0_#D9E2F2] cursor-pointer"
            >
              Choose Another Section
            </button>
          </div>
        </section>

        {/* Sub-skill Breakdown */}
        <section className="bb-card rounded-3xl p-6 bg-white">
          <h2 className="text-base font-extrabold text-[#17233C] flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-[#3B6EF6]" />
            <span>Performance by Topic</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(summary.bySkill).map(([skill, st]) => {
              const p = Math.round((st.correct / st.total) * 100);
              return (
                <div key={skill} className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-[#17233C]">{skill}</span>
                    <span className="text-[#284B9E]">
                      {st.correct}/{st.total} ({p}%)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        p >= 75 ? 'bg-[#10B981]' : p >= 50 ? 'bg-[#F59E0B]' : 'bg-[#F43F5E]'
                      }`}
                      style={{ width: `${p}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Filterable Question Breakdown */}
        <section className="bb-card rounded-3xl p-6 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-base font-extrabold text-[#17233C]">Question-by-Question Review</h2>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: `All (${summary.total})` },
                { id: 'incorrect', label: `Incorrect (${summary.total - summary.correctCount})` },
                { id: 'correct', label: `Correct (${summary.correctCount})` },
                { id: 'flagged', label: `Marked (${summary.items.filter((i) => i.isFlagged).length})` },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilter(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 cursor-pointer ${
                    filter === t.id
                      ? 'bg-[#17233C] text-white border-[#17233C]'
                      : 'bg-white text-[#475569] border-[#DCE4F3]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-[#EEF2FA]">
            {filteredItems.map((it) => (
              <button
                key={it.uid}
                onClick={() => onReviewQuestion(it.idx)}
                className="w-full py-3.5 px-3 hover:bg-[#F8FAFF] rounded-xl flex items-center justify-between gap-4 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-8 h-8 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 ${
                      it.isCorrect
                        ? 'bg-[#ECFDF5] text-[#059669] border border-[#6EE7B7]'
                        : 'bg-[#FFF1F2] text-[#E11D48] border border-[#FDA4AF]'
                    }`}
                  >
                    {it.idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#17233C] truncate">
                      {it.q.subSkill}{' '}
                      <span className="text-xs font-semibold text-[#64748B]">• ID {it.q.id}</span>
                    </div>
                    <div className="text-xs text-[#5A6B8C]">
                      Your answer:{' '}
                      <strong className={it.isCorrect ? 'text-[#059669]' : 'text-[#E11D48]'}>
                        {it.selected || 'None'}
                      </strong>{' '}
                      • Correct: <strong className="text-[#059669]">{it.q.correctAnswer}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {it.isFlagged && <Flag className="w-4 h-4 text-[#E11D48] fill-current" />}
                  {it.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                  ) : (
                    <XCircle className="w-5 h-5 text-[#F43F5E]" />
                  )}
                </div>
              </button>
            ))}

            {filteredItems.length === 0 && (
              <div className="py-8 text-center text-sm font-semibold text-[#64748B]">
                No questions match this filter.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

