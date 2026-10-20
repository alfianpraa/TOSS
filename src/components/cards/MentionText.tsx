import { splitMentions } from "@/lib/mentions";

export function MentionText({
  content,
  names,
  className,
}: {
  content: string;
  names: string[];
  className?: string;
}) {
  return (
    <p className={className}>
      {splitMentions(content, names).map((part, i) =>
        part.mention ? (
          <span
            key={i}
            className="rounded bg-brand/10 px-1 font-medium text-brand"
          >
            {part.text}
          </span>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </p>
  );
}
