import { formatDuration } from "@/lib/timeUtils";

export default function StatsBySubject({ sessions, subjects }) {
  const totals = subjects.map((subject) => {
    const total = sessions
      .filter((s) => s.subjectId === subject.id)
      .reduce((sum, s) => sum + s.durationSeconds, 0);
    return { ...subject, total };
  });

  const maxTotal = Math.max(1, ...totals.map((t) => t.total));

  return (
    <section className="rounded-2xl border border-border bg-surface-card p-6 backdrop-blur-xl">
      <h2 className="text-sm font-semibold text-ink">Po predmetu</h2>
      {totals.length === 0 && (
        <p className="mt-3 text-sm text-ink-muted">Nema predmeta.</p>
      )}
      <div className="mt-5 flex flex-col gap-4">
        {totals.map((t) => (
          <div key={t.id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-ink-secondary">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                {t.name}
              </span>
              <span className="font-mono tabular-nums text-ink">
                {formatDuration(t.total)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${(t.total / maxTotal) * 100}%`,
                  backgroundColor: t.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
