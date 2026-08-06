import SubjectManager from "@/components/SubjectManager";

export const metadata = {
  title: "Predmeti — Study Timer",
};

export default function SubjectsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-10 px-6 py-16">
      <h1 className="text-2xl font-semibold text-ink">Predmeti</h1>
      <SubjectManager />
    </main>
  );
}
