"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginForm() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setSubmitting(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else if (!data.session) {
        setInfo("Proveri email da potvrdiš nalog, pa se prijavi.");
      }
    }

    setSubmitting(false);
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6 rounded-3xl border border-border bg-surface-card p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <div className="flex gap-1 rounded-full border border-border bg-white/[0.03] p-1">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setError("");
            setInfo("");
          }}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            mode === "signin" ? "bg-accent text-white" : "text-ink-secondary hover:text-ink"
          }`}
        >
          Prijava
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setError("");
            setInfo("");
          }}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            mode === "signup" ? "bg-accent text-white" : "text-ink-secondary hover:text-ink"
          }`}
        >
          Registracija
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-ink placeholder:text-ink-muted outline-none focus:border-accent"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Lozinka"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-ink placeholder:text-ink-muted outline-none focus:border-accent"
        />

        {error && <p className="text-sm text-danger">{error}</p>}
        {info && <p className="text-sm text-accent">{info}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {mode === "signin" ? "Prijavi se" : "Napravi nalog"}
        </button>
      </form>
    </div>
  );
}
