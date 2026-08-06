"use client";

import { useSessions, useSubjects } from "@/lib/storage";
import {
  filterSince,
  startOfDay,
  startOfMonth,
  startOfWeek,
  sumDuration,
} from "@/lib/timeUtils";
import StatsSummary from "@/components/StatsSummary";
import StatsBySubject from "@/components/StatsBySubject";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import SessionHistory from "@/components/SessionHistory";

export default function StatsPage() {
  const sessions = useSessions();
  const subjects = useSubjects();

  const todayTotal = sumDuration(filterSince(sessions, startOfDay()));
  const weekTotal = sumDuration(filterSince(sessions, startOfWeek()));
  const monthTotal = sumDuration(filterSince(sessions, startOfMonth()));
  const allTotal = sumDuration(sessions);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-ink">Statistika</h1>
        <p className="mt-2 text-sm text-ink-secondary">Pregled tvog vremena za učenje.</p>
      </div>

      <StatsSummary
        todayTotal={todayTotal}
        weekTotal={weekTotal}
        monthTotal={monthTotal}
        allTotal={allTotal}
      />

      <StatsBySubject sessions={sessions} subjects={subjects} />
      <ActivityHeatmap sessions={sessions} />
      <SessionHistory sessions={sessions} subjects={subjects} />
    </main>
  );
}
