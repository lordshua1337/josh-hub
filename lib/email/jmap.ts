// Fastmail JMAP client. Server-only.
// Key change vs the original email-engine: drafts are PARKED in the Drafts
// mailbox (so they show up in Fastmail's UI too) rather than created in-memory
// and immediately submitted. Sending is a separate operation, triggered by the
// hub's review UI after Josh approves.

import "server-only";

const AUTH_URL = "https://api.fastmail.com/.well-known/jmap";

type JmapSession = { apiUrl: string; accountId: string };

let sessionCache: { value: JmapSession; expiresAt: number } | null = null;

function token(): string {
  const t = process.env.FASTMAIL_API_TOKEN;
  if (!t) throw new Error("FASTMAIL_API_TOKEN not set");
  return t;
}

async function getSession(): Promise<JmapSession> {
  if (sessionCache && sessionCache.expiresAt > Date.now()) return sessionCache.value;
  const res = await fetch(AUTH_URL, { headers: { Authorization: `Bearer ${token()}` } });
  if (!res.ok) throw new Error(`JMAP session: HTTP ${res.status}`);
  const data = (await res.json()) as { apiUrl: string; primaryAccounts: Record<string, string> };
  const accountId = data.primaryAccounts["urn:ietf:params:jmap:mail"];
  if (!accountId) throw new Error("No mail account in JMAP session");
  const value = { apiUrl: data.apiUrl, accountId };
  sessionCache = { value, expiresAt: Date.now() + 10 * 60_000 };
  return value;
}

export async function jmapCall<T = unknown>(method: string, args: Record<string, unknown>): Promise<T> {
  const { apiUrl, accountId } = await getSession();
  const body = {
    using: [
      "urn:ietf:params:jmap:core",
      "urn:ietf:params:jmap:mail",
      "urn:ietf:params:jmap:submission",
    ],
    methodCalls: [[method, { accountId, ...args }, "0"]],
  };
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`JMAP ${method} HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = (await res.json()) as { methodResponses: [[string, T, string]] };
  const [respMethod, response] = data.methodResponses[0];
  if (respMethod === "error") throw new Error(`JMAP ${method} returned error: ${JSON.stringify(response)}`);
  return response;
}

// ----------- mailboxes ----------------

let mailboxCache: { inbox?: string; drafts?: string; sent?: string; trash?: string; expiresAt: number } | null = null;

async function getRoleMailboxes(): Promise<{ inbox: string; drafts: string; sent: string; trash: string }> {
  if (mailboxCache && mailboxCache.expiresAt > Date.now() && mailboxCache.inbox && mailboxCache.drafts && mailboxCache.sent && mailboxCache.trash) {
    return mailboxCache as { inbox: string; drafts: string; sent: string; trash: string; expiresAt: number };
  }
  const res = await jmapCall<{ list: { id: string; role: string | null }[] }>("Mailbox/get", {
    properties: ["id", "role"],
  });
  const out: { inbox?: string; drafts?: string; sent?: string; trash?: string } = {};
  for (const mb of res.list) {
    if (mb.role === "inbox") out.inbox = mb.id;
    else if (mb.role === "drafts") out.drafts = mb.id;
    else if (mb.role === "sent") out.sent = mb.id;
    else if (mb.role === "trash") out.trash = mb.id;
  }
  if (!out.inbox || !out.drafts || !out.sent || !out.trash) {
    throw new Error(`Missing role mailboxes: ${JSON.stringify(out)}`);
  }
  mailboxCache = { ...(out as Required<typeof out>), expiresAt: Date.now() + 30 * 60_000 };
  return out as { inbox: string; drafts: string; sent: string; trash: string };
}

// ----------- inbox reads ----------------

export type JmapEmail = {
  id: string;
  threadId: string;
  from: { name?: string; email: string }[] | null;
  to: { name?: string; email: string }[] | null;
  subject: string;
  receivedAt: string;
  preview: string;
  bodyValues?: Record<string, { value: string }>;
  keywords?: Record<string, boolean>;
};

/**
 * Pull recent emails from the inbox. By default only unread, but `includeRead`
 * is useful for the very first poll to backfill.
 */
export async function fetchRecentInbox(opts: { sinceMinutes?: number; includeRead?: boolean; limit?: number } = {}): Promise<JmapEmail[]> {
  const { sinceMinutes = 10, includeRead = false, limit = 50 } = opts;
  const { inbox } = await getRoleMailboxes();
  const since = new Date(Date.now() - sinceMinutes * 60_000).toISOString();
  const filter: Record<string, unknown> = { inMailbox: inbox, after: since };
  if (!includeRead) filter.hasKeyword = { $not: "$seen" };
  const query = await jmapCall<{ ids: string[] }>("Email/query", {
    filter,
    sort: [{ property: "receivedAt", isAscending: false }],
    limit,
  });
  if (!query.ids?.length) return [];
  const got = await jmapCall<{ list: JmapEmail[] }>("Email/get", {
    ids: query.ids,
    properties: ["id", "threadId", "from", "to", "subject", "receivedAt", "preview", "bodyValues", "keywords"],
    fetchTextBodyValues: true,
  });
  return got.list || [];
}

// ----------- drafts ----------------

/**
 * Create a parked draft in the Drafts mailbox. Sets In-Reply-To headers so the
 * thread is properly linked. Returns the new draft id (usable later by sendDraft).
 */
export async function parkDraft(opts: {
  inReplyToEmailId: string;
  to: string;
  subject: string;
  body: string;
  fromAddress?: string;
}): Promise<string> {
  const { drafts } = await getRoleMailboxes();
  const fromAddress = opts.fromAddress || process.env.FASTMAIL_FROM_ADDRESS || "josh@prometheusconsulting.ai";

  // Fetch the original email's messageId so the threading headers are correct.
  const orig = await jmapCall<{ list: { messageId?: string[] | null }[] }>("Email/get", {
    ids: [opts.inReplyToEmailId],
    properties: ["messageId"],
  });
  const inReplyToHeader = orig.list?.[0]?.messageId?.[0] ?? null;

  const created = await jmapCall<{ created?: Record<string, { id: string }>; notCreated?: unknown }>("Email/set", {
    create: {
      d: {
        from: [{ email: fromAddress }],
        to: [{ email: opts.to }],
        subject: opts.subject.startsWith("Re:") ? opts.subject : `Re: ${opts.subject}`,
        ...(inReplyToHeader ? { inReplyTo: [inReplyToHeader] } : {}),
        textBody: [{ partId: "p1", type: "text/plain" }],
        bodyValues: { p1: { value: opts.body, charset: "utf-8" } },
        keywords: { $draft: true, $seen: true },
        mailboxIds: { [drafts]: true },
      },
    },
  });
  const id = created.created?.d?.id;
  if (!id) throw new Error(`parkDraft failed: ${JSON.stringify(created)}`);
  return id;
}

/**
 * Update a parked draft's body before submission. Used when Josh edits the
 * draft in the hub UI before hitting Send.
 */
export async function updateDraftBody(draftId: string, newBody: string): Promise<void> {
  await jmapCall("Email/set", {
    update: {
      [draftId]: {
        textBody: [{ partId: "p1", type: "text/plain" }],
        bodyValues: { p1: { value: newBody, charset: "utf-8" } },
      },
    },
  });
}

/**
 * Submit (actually send) a parked draft. Strips $draft keyword + moves to Sent.
 */
export async function sendDraft(draftId: string, to: string, fromAddress?: string): Promise<void> {
  const { sent, drafts } = await getRoleMailboxes();
  const from = fromAddress || process.env.FASTMAIL_FROM_ADDRESS || "josh@prometheusconsulting.ai";
  await jmapCall("EmailSubmission/set", {
    create: {
      s: {
        emailId: draftId,
        envelope: {
          mailFrom: { email: from },
          rcptTo: [{ email: to }],
        },
      },
    },
    onSuccessUpdateEmail: {
      "#s": {
        "keywords/$draft": null,
        "keywords/$seen": true,
        [`mailboxIds/${drafts}`]: null,
        [`mailboxIds/${sent}`]: true,
      },
    },
  });
}

/**
 * Discard a parked draft entirely (moves to trash). Used when Josh wants to
 * skip a draft instead of sending it.
 */
export async function discardDraft(draftId: string): Promise<void> {
  const { trash, drafts } = await getRoleMailboxes();
  await jmapCall("Email/set", {
    update: {
      [draftId]: {
        [`mailboxIds/${drafts}`]: null,
        [`mailboxIds/${trash}`]: true,
      },
    },
  });
}

/**
 * Mark an inbound email as read in the inbox so it doesn't keep getting picked
 * up by future polls.
 */
export async function markAsRead(emailId: string): Promise<void> {
  await jmapCall("Email/set", {
    update: {
      [emailId]: { "keywords/$seen": true },
    },
  });
}
