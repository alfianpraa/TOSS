"use client";

import { useRef, useState } from "react";

export type MentionUser = { id: string; name: string };

const MENTION_QUERY = /@([^\n@]{0,30})$/;

export function MentionTextarea({
  users,
  className,
  ...props
}: {
  users: MentionUser[];
  className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  const matches =
    query === null
      ? []
      : users
          .filter((u) => u.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 5);

  function updateQuery() {
    const el = ref.current;
    if (!el) return;
    const beforeCaret = el.value.slice(0, el.selectionStart);
    const match = beforeCaret.match(MENTION_QUERY);
    // Only trigger when "@" starts a word.
    const startIdx = match ? beforeCaret.length - match[0].length : -1;
    const atWordStart = startIdx <= 0 || /\s/.test(beforeCaret[startIdx - 1]);
    setQuery(match && atWordStart ? match[1] : null);
    setActive(0);
  }

  function insert(user: MentionUser) {
    const el = ref.current;
    if (!el || query === null) return;
    const caret = el.selectionStart;
    const start = caret - query.length - 1;
    el.setRangeText(`@${user.name} `, start, caret, "end");
    el.focus();
    setQuery(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (matches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insert(matches[active]);
    } else if (e.key === "Escape") {
      setQuery(null);
    }
  }

  return (
    <div className="relative">
      <textarea
        {...props}
        ref={ref}
        className={`block w-full ${className ?? ""}`}
        onInput={updateQuery}
        onKeyUp={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") updateQuery();
        }}
        onClick={updateQuery}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setQuery(null), 120)}
      />
      {matches.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-30 mt-1 w-56 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
        >
          {matches.map((user, i) => (
            <li key={user.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insert(user);
                }}
                className={`block w-full cursor-pointer px-3 py-1.5 text-left text-sm ${
                  i === active ? "bg-brand/10 text-brand" : "text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                @{user.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
