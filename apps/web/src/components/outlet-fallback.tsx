export function OutletFallback() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-[12rem] items-center justify-center"
    >
      <div
        aria-hidden
        className="size-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
      />
      <span className="sr-only">加载中</span>
    </div>
  );
}
