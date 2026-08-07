import LoginForm from "@/components/LoginForm";

export const metadata = {
  title: "Prijava — Study Timer",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <h1 className="text-2xl font-semibold text-ink">Study Timer</h1>
      <LoginForm />
    </main>
  );
}
