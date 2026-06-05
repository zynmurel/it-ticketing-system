export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/30 px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>IT Ticketing — Internal support portal</p>
        <p>© {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
