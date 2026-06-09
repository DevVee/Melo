export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        {/* Animated logo mark */}
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  )
}
