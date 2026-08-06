import Link from "next/link";
import SettingsForm from "@/components/SettingsForm";

export const metadata = {
  title: "Podešavanja — Study Timer",
};

export default function SettingsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-8 px-6 py-16">
      <div className="flex w-full max-w-md flex-col items-center gap-2 text-center">
        <Link
          href="/"
          className="inline-flex self-start items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Nazad na tajmer
        </Link>
        <h1 className="text-2xl font-semibold text-ink">Podešavanja tajmera</h1>
      </div>
      <SettingsForm />
    </main>
  );
}
