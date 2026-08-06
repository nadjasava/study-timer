import Timer from "@/components/Timer";
import AmbientPlayer from "@/components/AmbientPlayer";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-10 px-6 py-16">
      <h1 className="text-2xl font-semibold text-ink">Tajmer</h1>
      <Timer />
      <AmbientPlayer />
    </main>
  );
}
