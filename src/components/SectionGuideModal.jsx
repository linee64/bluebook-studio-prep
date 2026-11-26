import React from 'react';
import {
  BookOpen,
  Lightbulb,
  SpellCheck,
  Compass,
  Zap,
  AlertTriangle,
  Play,
  X,
} from 'lucide-react';

const SECTION_GUIDES = {
  craft: {
    title: 'Craft and Structure',
    subtitle: 'Words in Context • Text Structure & Purpose • Cross-Text Connections',
    icon: BookOpen,
    accentBg: 'bg-[#EEF4FF]',
    accentText: 'text-[#284B9E]',
    accentBorder: 'border-[#BFD3FA]',
    badgeBg: 'bg-[#3B6EF6]',
    strategy: [
      'Words in Context: сначала закрой варианты A–D, прочитай предложение с пропуском и подбери своё слово по смыслу. Только потом ищи точный синоним.',
      'Ищи логические связки (however, although, indeed, therefore) — они сразу показывают, усиливается мысль или идёт контраст.',
      'Text Structure & Purpose: смотри на первый глагол в варианте (illustrate, challenge, qualify) и проверяй, описывает ли он весь абзац, а не одну деталь.',
      'Cross-Text Connections: сформулируй позицию Text 1 и Text 2 по отдельности (согласны, спорят или дополняют) и только затем сравнивай.',
    ],
    lifehacks: [
      'Если два варианта в Words in Context — полные синонимы по смыслу, оба почти наверняка неверны.',
      'В Cross-Text Connections правильный ответ часто мягкий и точный (qualifies, partially agrees), а не категоричный.',
      'В заданиях на структуру текста перечитывай первое и последнее предложения — в них обычно заложена главная цель отрывка.',
    ],
    traps: [
      'Красивое слово, которое подходит к общей теме текста, но не вписывается в конкретную логику предложения с пропуском.',
      'Второе значение знакомых слов (secondary meaning): SAT любит редкие значения, например check = сдерживать, arrest = остановить.',
      'Слишком узкий вариант в Purpose — описывает только один пример из середины текста вместо функции всего отрывка.',
    ],
  },
  info: {
    title: 'Information and Ideas',
    subtitle: 'Central Ideas & Details • Inferences • Textual & Quantitative Evidence',
    icon: Lightbulb,
    accentBg: 'bg-[#ECFDF5]',
    accentText: 'text-[#047857]',
    accentBorder: 'border-[#A7F3D0]',
    badgeBg: 'bg-[#10B981]',
    strategy: [
      'Central Ideas: после чтения перескажи главную мысль в 5–7 простых слов, прежде чем смотреть варианты ответов.',
      'Textual Evidence: выдели в вопросе конкретную гипотезу или утверждение учёного. Верная цитата должна напрямую доказывать именно его.',
      'Quantitative Evidence (графики и таблицы): сначала изучи заголовок, оси X/Y и единицы измерения, затем найди тезис в тексте, который нужно подтвердить цифрами.',
      'Inferences: строй строгую цепочку «факт A + факт B → вывод» без домыслов.',
    ],
    lifehacks: [
      'На графиках сразу вычёркивай варианты с неверными числами, даже если по смыслу текста они звучат правдоподобно.',
      'Верный ответ на SAT на 100% опирается на текст — если приходится «додумывать» логический мостик, вариант ложный.',
      'В длинных текстах на детали ищи ключевое слово из вопроса и перечитывай ровно 1–2 предложения вокруг него.',
    ],
    traps: [
      'Крайние слова (always, never, only, completely, proves) почти всегда делают вариант неверным.',
      'Верная цифра с графика, которая относится к другой категории или вообще не доказывает утверждение из текста.',
      'Подмена корреляции причиной: в тексте сказано associated with (связано), а в варианте — causes (вызывает).',
    ],
  },
  english: {
    title: 'Standard English Conventions',
    subtitle: 'Sentence Boundaries • Punctuation • Grammar & Verb Forms',
    icon: SpellCheck,
    accentBg: 'bg-[#FFF1F2]',
    accentText: 'text-[#BE123C]',
    accentBorder: 'border-[#FECDD3]',
    badgeBg: 'bg-[#F43F5E]',
    strategy: [
      'Сначала посмотри на варианты A–D: отличия сразу подскажут тему — границы предложений (пунктуация) или грамматика (время, число, форма).',
      'Boundaries: найди подлежащее и сказуемое слева и справа от пропуска. Определи, где полное предложение (Independent Clause), а где зависимая часть.',
      'Для согласования глагола мысленно вычёркивай предложные обороты (of the..., in the...) и вставки между двумя запятыми.',
    ],
    lifehacks: [
      'Правило эквивалентности: если в вариантах есть точка (.) и точка с запятой (;) в одинаковой позиции между двумя полными предложениями — оба неверны.',
      'Перед двоеточием (:) почти всегда должно стоять законченное предложение, а после него — пояснение, список или пример.',
      'Dangling Modifier: если фраза начинается с описания действия (Walking down the street, ...), сразу после запятой обязан стоять тот, кто это делает.',
    ],
    traps: [
      'Comma Splice — соединение двух полных предложений одной запятой без союза FANBOYS (for, and, nor, but, or, yet, so).',
      'Согласование глагола с ближайшим словом в обороте вместо главного подлежащего (The collection of rare books is, а не are).',
      'Одиночная запятая между подлежащим и сказуемым или сразу после предлога — так разделять нельзя.',
    ],
  },
};

export function SectionGuideModal({ sectionId, totalCount, onClose, onProceed }) {
  const guide = SECTION_GUIDES[sectionId];
  if (!guide) return null;

  const Icon = guide.icon;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#17233C]/50 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-[#1B2A4A] rounded-3xl shadow-[0_8px_0_#1B2A4A] max-w-2xl w-full overflow-hidden flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 bg-[#F5F8FF] border-b-2 border-[#DCE4F3] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${guide.accentBg} ${guide.accentText} border-2 ${guide.accentBorder} flex items-center justify-center shrink-0`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-[#17233C] truncate">
                  {guide.title}
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-white border border-[#DCE4F3] text-[11px] font-extrabold text-[#475569]">
                  {totalCount} Qs
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#5A6B8C] font-semibold truncate">
                {guide.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#E2E8F0] text-[#475569] cursor-pointer shrink-0"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Strategy */}
          <div className="rounded-2xl border-2 border-[#BFD3FA] bg-[#F8FAFF] p-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#284B9E] mb-2.5">
              <Compass className="w-4 h-4 shrink-0" />
              <span>Стратегия решения</span>
            </div>
            <ol className="space-y-2">
              {guide.strategy.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#1E293B] leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-[#3B6EF6] text-white text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Lifehacks */}
            <div className="rounded-2xl border-2 border-[#A7F3D0] bg-[#ECFDF5]/60 p-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#047857] mb-2.5">
                <Zap className="w-4 h-4 shrink-0" />
                <span>Лайфхаки</span>
              </div>
              <ul className="space-y-2">
                {guide.lifehacks.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-[#1E293B] leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0 mt-2" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Common Traps */}
            <div className="rounded-2xl border-2 border-[#FECDD3] bg-[#FFF1F2]/60 p-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#BE123C] mb-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Частые ловушки</span>
              </div>
              <ul className="space-y-2">
                {guide.traps.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-[#1E293B] leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E] shrink-0 mt-2" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#F8FAFC] border-t-2 border-[#DCE4F3] flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs font-bold text-[#5A6B8C]">
            Далее откроются настройки теста
          </span>
          <button
            onClick={onProceed}
            className="bb-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3B6EF6] hover:bg-[#2E5CE0] text-white font-extrabold text-sm border-2 border-[#1B2A4A] shadow-[0_3px_0_#1B2A4A] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Начать тест</span>
          </button>
        </div>
      </div>
    </div>
  );
}
