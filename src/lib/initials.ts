export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.match(/[A-Za-z]/)?.[0] ?? "")
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
