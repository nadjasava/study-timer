import { formatDuration, startOfDay } from "@/lib/timeUtils";

const WEEKS = 18;
const LEVEL_OPACITY = [0, 0.25, 0.5, 0.75, 1];

function localDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function levelFor(seconds, maxSeconds) {
  if (!seconds || maxSeconds === 0) return 0;
  const ratio = seconds / maxSeconds;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

export default function ActivityHeatmap({ sessions }) {
  const totalsByDate = {};
  for (const s of sessions) {
    const key = localDateKey(new Date(s.startTime));
    totalsByDate[key] = (totalsByDate[key] || 0) + s.durationSeconds;
  }

  const today = startOfDay();
  const todayDow = (today.getDay() + 6) % 7; // Monday-based: 0 = Mon ... 6 = Sun

  // Anchor the grid to the Monday of the current week, then step back whole
  // weeks — this keeps every column a full Mon–Sun week except the last,
  // which only trails off because those days haven't happened yet.
  const currentWeekMonday = new Date(today);
  currentWeekMonday.setDate(currentWeekMonday.getDate() - todayDow);
  const gridStart = new Date(currentWeekMonday);
  gridStart.setDate(gridStart.getDate() - (WEEKS - 1) * 7);

  const cells = [];
  for (let i = 0; i < WEEKS * 7; i++) {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    cells.push(d > today ? null : d);
  }

  const maxSeconds = Math.max(
    0,
    ...cells.filter(Boolean).map((d) => totalsByDate[localDateKey(d)] || 0)
  );

  return (
    <section className="overflow-x-auto rounded-2xl border border-border bg-surface-card p-6 backdrop-blur-xl">
      <h2 className="text-sm font-semibold text-ink">Aktivnost</h2>
      <div className="mt-5 grid w-max grid-flow-col grid-rows-7 gap-[3px]">
        {cells.map((d, i) => {
          if (!d) {
            return <div key={i} className="h-[11px] w-[11px]" />;
          }
          const key = localDateKey(d);
          const seconds = totalsByDate[key] || 0;
          const level = levelFor(seconds, maxSeconds);
          return (
            <div
              key={i}
              title={`${key} — ${seconds > 0 ? formatDuration(seconds) : "bez učenja"}`}
              className="h-[11px] w-[11px] rounded-[3px]"
              style={{
                backgroundColor:
                  level === 0 ? "rgba(255,255,255,0.06)" : "var(--color-accent)",
                opacity: level === 0 ? 1 : LEVEL_OPACITY[level],
              }}
            />
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-end gap-1.5 text-xs text-ink-muted">
        <span>Manje</span>
        {LEVEL_OPACITY.map((opacity, level) => (
          <span
            key={level}
            className="h-[11px] w-[11px] rounded-[3px]"
            style={{
              backgroundColor: level === 0 ? "rgba(255,255,255,0.06)" : "var(--color-accent)",
              opacity: level === 0 ? 1 : opacity,
            }}
          />
        ))}
        <span>Više</span>
      </div>
    </section>
  );
}
