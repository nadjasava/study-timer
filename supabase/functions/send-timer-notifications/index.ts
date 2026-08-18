// Study Timer — scheduled push notifications
//
// Runs on a cron schedule (see supabase/schema.sql / setup notes). For each
// user whose pomodoro phase has ended while the app wasn't open to notice,
// sends a Web Push notification and marks that phase_end_at as handled so
// the next run (a minute later) doesn't re-send it.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");

webpush.setVapidDetails("mailto:noreply@study-timer.app", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const PHASE_MESSAGE = {
  work: { title: "Pauza!", body: "Vreme je za pauzu." },
  break: { title: "Nazad na učenje!", body: "Pauza je gotova." },
  longBreak: { title: "Nazad na učenje!", body: "Duža pauza je gotova." },
};

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: dueTimers, error } = await supabase
    .from("active_timer")
    .select("user_id, phase, phase_end_at, last_notified_end_at")
    .eq("is_running", true)
    .not("phase_end_at", "is", null)
    .lte("phase_end_at", new Date().toISOString());

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const due = (dueTimers ?? []).filter((t) => t.last_notified_end_at !== t.phase_end_at);

  for (const timer of due) {
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", timer.user_id);

    const message = PHASE_MESSAGE[timer.phase] ?? PHASE_MESSAGE.work;
    const payload = JSON.stringify({ ...message, url: "/" });

    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err) {
        // 404/410 means the browser dropped this subscription — stop trying it.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }

    await supabase
      .from("active_timer")
      .update({ last_notified_end_at: timer.phase_end_at })
      .eq("user_id", timer.user_id);
  }

  return new Response(JSON.stringify({ processed: due.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
