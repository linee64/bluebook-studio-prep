const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';

export async function askStarka({
  passage,
  prompt,
  choices,
  selectedAnswer,
  correctAnswer,
  subSkill,
  signal,
}) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('Не найден VITE_DEEPSEEK_API_KEY в .env.local');
  }
  const choiceText = Object.entries(choices)
    .map(([letter, segs]) => `${letter}. ${segs.map((s) => s.t).join('')}`)
    .join('\n');

  const passageText = passage || '(no passage)';
  const promptText = prompt.map((s) => s.t).join('');

  const systemPrompt = `Ты — Старка, умный и дружелюбный SAT-тьютор. Ученик ответил на вопрос неправильно. Объясни кратко и чётко:
1. Почему правильный ответ (${correctAnswer}) — верный. Процитируй конкретные слова/фразы из текста.
2. Почему выбранный ответ (${selectedAnswer}) — неверный. Объясни, в чём ловушка.
3. Дай короткий совет, как не попасться в подобное в будущем.

Пиши на русском. Будь конкретной — никакой воды. Используй маркдаун для форматирования (жирный для ключевых слов, списки). Ответ — максимум 250 слов.`;

  const userMessage = `Тип вопроса: ${subSkill}

Текст/пассаж:
${passageText}

Вопрос:
${promptText}

Варианты:
${choiceText}

Ученик выбрал: ${selectedAnswer}
Правильный ответ: ${correctAnswer}`;

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 800,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${errText}`);
  }

  return response.body;
}

export function parseSSEStream(readableStream, onChunk, onDone, onError) {
  const reader = readableStream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let cancelled = false;

  function pump() {
    if (cancelled) return;
    reader
      .read()
      .then(({ done, value }) => {
        if (cancelled) return;
        if (done) {
          onDone();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (cancelled) return;
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              onChunk(delta);
            }
          } catch {
            // skip malformed chunks
          }
        }
        pump();
      })
      .catch((err) => {
        if (cancelled || err?.name === 'AbortError') return;
        onError(err);
      });
  }

  pump();

  return () => {
    cancelled = true;
    reader.cancel().catch(() => {});
  };
}
