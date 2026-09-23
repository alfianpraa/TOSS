export function AnimatedBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-zinc-100"
    >
      <div className="animate-drift-a absolute -left-32 -top-32 h-[26rem] w-[26rem] rounded-full bg-brand-dark/10 blur-3xl" />
      <div className="animate-drift-b absolute -right-24 top-1/3 h-[22rem] w-[22rem] rounded-full bg-brand/10 blur-3xl" />
      <div className="animate-drift-c absolute -bottom-32 left-1/4 h-[24rem] w-[24rem] rounded-full bg-brand-dark/10 blur-3xl" />
    </div>
  );
}
