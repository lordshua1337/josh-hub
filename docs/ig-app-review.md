# Instagram Auto-Responder — Meta setup + App Review

Goal: let the hub receive Instagram DMs and reply (auto for keyword triggers,
manual for everything else). The pipeline is already built; this is the
external Meta paperwork that turns it on.

You only need to do this once. Everything in the hub already degrades to
"draft + copy-paste" until the token below is wired, so nothing breaks while
review is pending.

---

## What we're requesting (and why)

| Permission | Why we need it |
|---|---|
| `instagram_business_basic` | Read the account identity / link the IG user. |
| `instagram_business_manage_messages` | Receive DMs via webhook and send replies (the whole point). |

We are **not** requesting comment permissions yet (comment-to-DM is a later
phase). Keep the request narrow — fewer permissions = faster review.

Note on access levels:
- **Standard / dev access** works immediately for accounts that have a role on
  the app (i.e. your own account). Good for testing end-to-end before review.
- **Advanced access** (what App Review grants) is required to message the
  general public. You need this for the responder to work with real followers.

---

## Part 1 — App + connection (no review needed, ~20 min)

1. **Instagram account**: must be a **Business** or **Creator** account
   (IG app → Settings → Account type).
2. Go to <https://developers.facebook.com> → **My Apps → Create App** →
   type **Business**.
3. In the app, add the **Instagram** product → choose
   **"Instagram API with Instagram login"** (the newer path — no Facebook Page
   required).
4. Connect the Prometheus IG account when prompted, and add yourself as a
   role/tester on the app so dev-access tokens work for your account.
5. Generate an **Instagram access token** and note the **Instagram user ID**
   (the app's API setup screen shows both, or use the Graph API Explorer).

## Part 2 — Webhook (no review needed)

In the app → **Instagram → Webhooks** (or **Webhooks → Instagram**):

- **Callback URL:** `https://prometheus-hub.vercel.app/api/social/ig-webhook`
- **Verify token:** any random string — must exactly match the
  `IG_WEBHOOK_VERIFY_TOKEN` env var you set in Part 3.
- **Subscribe to field:** `messages`  (that's all we need for DMs).

When you click "Verify and Save", Meta hits the callback with a challenge and
our route echoes it back — if the token matches, it goes green. If it fails,
the token strings don't match exactly (check for trailing spaces).

## Part 3 — Vercel env vars

Add these in the Vercel project (Settings → Environment Variables), then
redeploy:

```
IG_GRAPH_TOKEN          = <the Instagram access token from Part 1>
IG_USER_ID              = <the Instagram user ID from Part 1>
IG_WEBHOOK_VERIFY_TOKEN = <the same random string used in Part 2>
```

(`JH_INGEST_KEY` already exists — it lets you trigger the reply cron manually
via `?key=...` for testing.)

The moment `IG_GRAPH_TOKEN` + `IG_USER_ID` are present, keyword-trigger DMs
start auto-sending and the "Send" button in DM Triage ships live instead of
marking ready_to_send.

## Part 4 — App Review submission (needed for the public)

Submit `instagram_business_manage_messages` for **Advanced Access**.

**Use-case description** (paste this, adjust names if needed):

> Prometheus Consulting uses this integration to manage its own business
> Instagram inbox. When a follower sends a direct message, our system
> classifies the message and either (a) sends an automatic reply when the
> follower messages a specific keyword we publish in our posts (for example
> "AUDIT"), or (b) drafts a suggested reply that the account owner reviews and
> sends manually from our internal dashboard. All replies are sent within the
> standard 24-hour messaging window in direct response to a user-initiated
> message. We do not send unsolicited or bulk messages.

**Screencast script** (record a 60–90s screen capture showing the real flow):

1. Show the IG account and a post whose caption says "DM me AUDIT".
2. From a second test account, send the Prometheus account a DM saying `AUDIT`.
3. Show the automatic reply arriving in that DM thread.
4. Open the hub DM Triage page (`/content/dms`) and show the message logged as
   an auto-sent reply.
5. Send a second, non-keyword DM (e.g. a real question). Show it appear in DM
   Triage as a *drafted, pending* reply, and click Send to deliver it.

That demonstrates both the auto path and the human-reviewed path, which is
exactly what the use-case text describes — reviewers approve quickly when the
screencast matches the words.

**Business verification:** Meta will likely require verifying the business
(Business Manager → Security Center). Have the SDVOB / business details ready.

---

## What's already built (so you know what the token switches on)

- `app/api/social/ig-webhook` — receives + stores DMs (and answers Meta's
  verification handshake).
- `app/api/cron/ig-replies` — every 5 min: keyword triggers → canned reply +
  auto-send; everything else → classify + draft + park for review.
- `lib/social/dm.ts` — classifier, voice-matched drafter, `sendIgDm`, trigger
  keywords (`TRIGGER_REPLIES` — edit here to add keywords beyond "audit").
- `/content/dms` — review queue: auto-sent shown with a ⚡ marker, triggers
  awaiting creds sorted to the top.

## Tuning later

- Add keywords: edit `TRIGGER_REPLIES` in `lib/social/dm.ts`.
- The 24-hour window is a hard Meta limit — replies only send to people who
  messaged within the last 24h. Keyword auto-replies always fire in time; a
  manual reply you sit on for >24h will fail with a window error (surfaced in
  DM Triage).
