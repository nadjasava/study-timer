import ExamManager from "@/components/ExamManager";

export const metadata = {
  title: "Ispiti — Study Timer",
};

export default function ExamsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-10 px-6 py-16">
      <h1 className="text-2xl font-semibold text-ink">Ispiti</h1>
      <ExamManager />
    </main>
  );
}
