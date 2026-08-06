import { formatDuration } from "@/lib/timeUtils";

export default function SessionHistory({ sessions, subjects }) {
  const subjectById = Object.fromEntries(subjects.map((s) => [s.id, s]));
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.startTime) - new Date(a.startTime)
  );

  return (
    <section className="rounded-2xl border border-border bg-surface-card p-6 backdrop-blur-xl">
      <h2 className="text-sm font-semibold text-ink">Istorija sesija</h2>
      {sorted.length === 0 && (
        <p className="mt-3 text-sm text-ink-muted">Još nema sesija.</p>
      )}
      <ul className="mt-4 flex flex-col divide-y divide-border">
        {sorted.slice(0, 50).map((s) => {
          const subject = subjectById[s.subjectId];
          return (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: subject?.color ?? "var(--color-ink-muted)" }}
                />
                <span className="truncate text-ink">
                  {subject?.name ?? "Obrisan predmet"}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="text-ink-muted">{s.date}</span>
                <span className="font-mono tabular-nums text-ink">
                  {formatDuration(s.durationSeconds)}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
