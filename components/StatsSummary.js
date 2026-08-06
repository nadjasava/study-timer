import { formatDuration } from "@/lib/timeUtils";

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-card px-4 py-6 text-center backdrop-blur-xl">
      <div className="font-mono text-xl font-semibold tabular-nums text-ink">{value}</div>
      <div className="mt-1.5 text-xs text-ink-muted">{label}</div>
    </div>
  );
}

export default function StatsSummary({ todayTotal, weekTotal, monthTotal, allTotal }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard label="Danas" value={formatDuration(todayTotal)} />
      <StatCard label="Ova nedelja" value={formatDuration(weekTotal)} />
      <StatCard label="Ovaj mesec" value={formatDuration(monthTotal)} />
      <StatCard label="Ukupno" value={formatDuration(allTotal)} />
    </div>
  );
}
