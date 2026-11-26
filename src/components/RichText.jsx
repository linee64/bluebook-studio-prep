import React from 'react';

function renderBlankAwareText(text, keyPrefix) {
  const parts = text.split(/(______+)/g);
  return parts.map((part, idx) => {
    if (/^______+$/.test(part)) {
      return (
        <span
          key={`${keyPrefix}-b-${idx}`}
          className="inline-block align-baseline mx-1 px-4 py-0.5 rounded-md border-b-2 border-[#284B9E] bg-[#EEF4FF] text-[#284B9E] font-sans text-[0.78em] font-bold tracking-wider select-none"
          aria-label="blank"
        >
          ______
        </span>
      );
    }
    return <React.Fragment key={`${keyPrefix}-t-${idx}`}>{part}</React.Fragment>;
  });
}

function applyHighlightSplits(nodes, highlights, onRemoveHighlight) {
  if (!highlights || highlights.length === 0) return nodes;

  let current = nodes;
  highlights.forEach((hl) => {
    if (!hl.text) return;
    const next = [];
    let matchedOnce = false;
    current.forEach((node, nIdx) => {
      if (typeof node === 'string' && !matchedOnce) {
        const pos = node.indexOf(hl.text);
        if (pos !== -1) {
          matchedOnce = true;
          const before = node.slice(0, pos);
          const match = node.slice(pos, pos + hl.text.length);
          const after = node.slice(pos + hl.text.length);
          if (before) next.push(before);
          next.push(
            <mark
              key={`hl-${hl.id}-${nIdx}`}
              onClick={(e) => {
                e.stopPropagation();
                onRemoveHighlight?.(hl.id);
              }}
              title="Click to remove highlight"
              className={`hl-${hl.color} transition-opacity hover:opacity-80`}
            >
              {match}
            </mark>
          );
          if (after) next.push(after);
          return;
        }
      }
      next.push(node);
    });
    current = next;
  });
  return current;
}

export function RichSegments({ segments, highlights = [], onRemoveHighlight, inline = true }) {
  if (!segments || segments.length === 0) return null;

  return (
    <>
      {segments.map((seg, idx) => {
        if (seg.t === '\n') {
          return <br key={`br-${idx}`} />;
        }

        // Split plain text for highlights if needed (only when inline highlights exist)
        let contentNodes = [seg.t];
        if (highlights.length > 0 && inline) {
          contentNodes = applyHighlightSplits(contentNodes, highlights, onRemoveHighlight);
        }

        const rendered = contentNodes.map((node, nIdx) => {
          if (typeof node === 'string') {
            return renderBlankAwareText(node, `${idx}-${nIdx}`);
          }
          return node;
        });

        if (seg.u && seg.i) {
          return (
            <u key={idx} className="decoration-[#1B2A4A] decoration-2 underline-offset-4 italic">
              {rendered}
            </u>
          );
        }
        if (seg.u) {
          return (
            <u key={idx} className="decoration-[#1B2A4A] decoration-2 underline-offset-4">
              {rendered}
            </u>
          );
        }
        if (seg.i) {
          return (
            <em key={idx} className="italic">
              {rendered}
            </em>
          );
        }
        return <React.Fragment key={idx}>{rendered}</React.Fragment>;
      })}
    </>
  );
}

