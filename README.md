# Study Timer

Pomodoro tajmer za praćenje vremena učenja po predmetima. Napravljen u Next.js-u, sa Supabase-om za autentikaciju i čuvanje podataka.

## Funkcionalnosti

- Pomodoro tajmer (učenje / pauza / duža pauza) sa podesivim trajanjima
- Praćenje sesija po predmetima koje sam kreiraš
- Statistika (danas / nedelja / mesec / ukupno), grafik po predmetu i heatmap aktivnosti
- Tajmer preživljava reload stranice i rad u pozadini (na mobilnom)
- Radi i offline — završene sesije se čuvaju lokalno i sinhronizuju kad se veza vrati
- Ambijentalna muzika za fokus tokom učenja

## Pokretanje lokalno

1. Instaliraj zavisnosti:

   ```bash
   npm install
   ```

2. Napravi Supabase projekat i u SQL Editoru pokreni `supabase/schema.sql` — pravi tabele (`subjects`, `sessions`, `pomodoro_settings`) i uključuje Row Level Security tako da svaki korisnik vidi samo svoje podatke.

3. Napravi `.env.local` fajl u korenu projekta sa svojim Supabase ključevima:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<tvoj-projekat>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<tvoj-anon-key>
   ```

4. Pokreni dev server:

   ```bash
   npm run dev
   ```

   Otvori [http://localhost:3000](http://localhost:3000).

## Struktura projekta

- `app/` — stranice (Next.js App Router): tajmer, predmeti, statistika, podešavanja, prijava
- `components/` — UI komponente
- `lib/` — Supabase klijent, autentikacija, čuvanje podataka, offline queue, pomoćne funkcije za vreme
- `supabase/schema.sql` — šema baze i RLS politike
