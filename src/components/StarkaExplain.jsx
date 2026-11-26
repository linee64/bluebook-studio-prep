import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Sparkles, X, RotateCcw, Loader2 } from 'lucide-react';
import { askStarka, parseSSEStream } from '../utils/starkaApi';

function renderInline(text, keyPrefix) {
  // Parse **bold**, *italic*, and `code` inline tokens
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`${keyPrefix}-b-${match.index}`} className="font-extrabold text-[#17233C]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={`${keyPrefix}-c-${match.index}`}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-white border border-[#DDD6FE] text-[#4C1D95] font-semibold text-[13px]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={`${keyPrefix}-i-${match.index}`} className="italic text-[#334155]">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

function renderMarkdown(text) {
  const lines = text.split('\n');
  const elements = [];

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={`sp-${lineIdx}`} className="h-1.5" />);
      return;
    }

    // Headings: #, ##, ###
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      elements.push(
        <div
          key={`h-${lineIdx}`}
          className="pt-2 first:pt-0 pb-0.5 flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-wide text-[#5B21B6]"
        >
          <span className="w-1.5 h-4 rounded-full bg-[#7C3AED] shrink-0" />
          <span>{renderInline(headingMatch[2], `h-${lineIdx}`)}</span>
        </div>
      );
      return;
    }

    // Bullet list (-, *, •) or numbered list (1., 2.)
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);

    if (bulletMatch) {
      elements.push(
        <div key={`ul-${lineIdx}`} className="flex items-start gap-2 pl-1 text-[13.5px] leading-relaxed text-[#334155]">
          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#7C3AED] shrink-0" />
          <div className="flex-1">{renderInline(bulletMatch[1], `ul-${lineIdx}`)}</div>
        </div>
      );
      return;
    }

    if (numMatch) {
      elements.push(
        <div key={`ol-${lineIdx}`} className="flex items-start gap-2 pl-1 text-[13.5px] leading-relaxed text-[#334155]">
          <span className="mt-0.5 w-5 h-5 rounded-md bg-[#DDD6FE] text-[#5B21B6] text-[11px] font-extrabold flex items-center justify-center shrink-0">
            {numMatch[1]}
          </span>
          <div className="flex-1">{renderInline(numMatch[2], `ol-${lineIdx}`)}</div>
        </div>
      );
      return;
    }

    elements.push(
      <p key={`p-${lineIdx}`} className="text-[13.5px] leading-relaxed text-[#334155]">
        {renderInline(trimmed, `p-${lineIdx}`)}
      </p>
    );
  });

  return elements;
}

export function StarkaTriggerButton({ onClick, isOpen }) {
  return (
    <button
      onClick={onClick}
      className={`bb-btn mt-3 w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl font-extrabold text-sm border-2 border-[#1B2A4A] shadow-[0_4px_0_#1B2A4A] cursor-pointer transition-all ${
        isOpen
          ? 'bg-[#EDE9FE] text-[#5B21B6]'
          : 'bg-gradient-to-r from-[#6C3AED] to-[#4F46E5] hover:from-[#5B21B6] hover:to-[#4338CA] text-white'
      }`}
    >
      <Bot className="w-5 h-5" />
      <span>{isOpen ? 'Старка открыта справа' : 'Старка, объясни'}</span>
      <Sparkles className={`w-4 h-4 ${isOpen ? 'text-[#7C3AED]' : 'text-[#FDE68A]'}`} />
    </button>
  );
}

export function StarkaSidePanel({ question, selectedAnswer, onClose }) {
  const [state, setState] = useState('loading'); // 'loading' | 'streaming' | 'done' | 'error'
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const cancelRef = useRef(null);
  const abortRef = useRef(null);
  const runIdRef = useRef(0);

  const runExplain = useCallback(async () => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const myRunId = ++runIdRef.current;
    const controller = new AbortController();
    abortRef.current = controller;

    setState('loading');
    setText('');
    setError('');

    const passageText = question.blocks
      .map((b) => {
        if (b.type === 'heading') return `[${b.text}]`;
        return (b.segments || []).map((s) => s.t).join('');
      })
      .join('\n');

    try {
      const stream = await askStarka({
        passage: passageText,
        prompt: question.prompt,
        choices: question.choices,
        selectedAnswer,
        correctAnswer: question.correctAnswer,
        subSkill: question.subSkill,
        signal: controller.signal,
      });

      if (runIdRef.current !== myRunId) return;
      setState('streaming');

      cancelRef.current = parseSSEStream(
        stream,
        (chunk) => {
          if (runIdRef.current !== myRunId) return;
          setText((prev) => prev + chunk);
        },
        () => {
          if (runIdRef.current !== myRunId) return;
          setState('done');
        },
        (err) => {
          if (runIdRef.current !== myRunId) return;
          setError(err.message || 'Stream error');
          setState('error');
        }
      );
    } catch (err) {
      if (err?.name === 'AbortError' || runIdRef.current !== myRunId) return;
      setError(err.message || 'Failed to reach Starka');
      setState('error');
    }
  }, [question, selectedAnswer]);

  useEffect(() => {
    runExplain();
    return () => {
      runIdRef.current += 1;
      if (cancelRef.current) cancelRef.current();
      if (abortRef.current) abortRef.current.abort();
    };
  }, [runExplain]);

  return (
    <aside className="flex flex-col h-full bg-[#FAF8FF] border-l-2 border-[#DDD6FE] min-h-0">
      {/* Header */}
      <div className="px-4 py-3.5 bg-gradient-to-r from-[#6C3AED] to-[#4F46E5] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white">Старка</span>
              <span className="text-[11px] font-semibold text-white/75">AI Тьютор</span>
            </div>
            <div className="text-[11px] font-bold text-[#DDD6FE]">
              Твой выбор: {selectedAnswer} · Верный: {question.correctAnswer}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {(state === 'done' || state === 'error') && (
            <button
              onClick={runExplain}
              title="Спросить заново"
              className="p-1.5 rounded-lg hover:bg-white/20 text-white/85 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            title="Закрыть панель Старки"
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/85 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Streaming indicator */}
      {state === 'streaming' && (
        <div className="px-4 py-1.5 bg-[#EDE9FE] border-b border-[#DDD6FE] flex items-center gap-1.5 text-[11px] font-bold text-[#5B21B6] shrink-0">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Старка печатает разбор...</span>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
        {state === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-2.5 py-12 text-[#5B21B6]">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm font-bold">Старка анализирует вопрос...</span>
          </div>
        )}

        {(state === 'streaming' || state === 'done') && text && (
          <div className="space-y-2">{renderMarkdown(text)}</div>
        )}

        {state === 'error' && (
          <div className="py-8 text-center space-y-3">
            <p className="text-sm font-bold text-[#DC2626]">Ошибка: {error}</p>
            <button
              onClick={runExplain}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6C3AED] text-white text-xs font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Попробовать снова</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      {state === 'done' && text && (
        <div className="px-4 py-2.5 border-t border-[#DDD6FE] bg-[#F5F3FF] text-[11px] font-bold text-[#7C3AED] flex items-center gap-1.5 shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Старка AI · DeepSeek</span>
        </div>
      )}
    </aside>
  );
}
