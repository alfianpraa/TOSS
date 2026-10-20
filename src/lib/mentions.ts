function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Finds "@Full Name" mentions for the given names. Longer names are matched
// first and consumed, so "@Alif Muhammad" never also counts as "@Alif".
export function findMentionedNames(content: string, names: string[]) {
  const found = new Set<string>();
  let remaining = content;
  const sorted = [...new Set(names)].sort((a, b) => b.length - a.length);
  for (const name of sorted) {
    const pattern = new RegExp(`@${escapeRegExp(name)}(?![\\p{L}\\p{N}])`, "giu");
    if (pattern.test(remaining)) {
      found.add(name);
      remaining = remaining.replace(pattern, " ");
    }
  }
  return found;
}

export type MentionPart = { text: string; mention: boolean };

export function splitMentions(content: string, names: string[]): MentionPart[] {
  const sorted = [...new Set(names)].sort((a, b) => b.length - a.length);
  if (sorted.length === 0) return [{ text: content, mention: false }];
  const pattern = new RegExp(
    `(@(?:${sorted.map(escapeRegExp).join("|")})(?![\\p{L}\\p{N}]))`,
    "giu"
  );
  // With one capture group, split() alternates plain text (even) and mentions (odd).
  return content
    .split(pattern)
    .map((text, index) => ({ text, mention: index % 2 === 1 }))
    .filter((part) => part.text !== "");
}
