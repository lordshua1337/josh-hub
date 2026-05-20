// Email categories + actions + folder routing.
// Ported from the original email-engine (src/lib/types.ts). Source of truth for
// the classifier and the drafting prompt.

export type EmailCategory =
  | "sales_inquiry"
  | "support_request"
  | "complaint"
  | "spam_nonhuman"
  | "spam_human"
  | "billing"
  | "job_seeker"
  | "hiring_investor"
  | "meeting_request"
  | "thank_you"
  | "system_notification"
  | "introduction"
  | "legal"
  | "partnership"
  | "newsletter"
  | "personal_suspect"
  | "unsubscribe"
  | "bounce"
  | "refund_cancel"
  | "follow_up"
  | "unclassifiable";

export type EmailAction =
  | "draft"
  | "move_to_folder"
  | "delete"
  | "archive"
  | "no_action";

export const CATEGORY_CONFIG: Record<EmailCategory, {
  action: EmailAction;
  folder: string | null;
  draft_reply: boolean;
  description: string;
}> = {
  sales_inquiry: { action: "draft", folder: null, draft_reply: true, description: "Sales inquiry -- qualify and offer scheduling link" },
  support_request: { action: "draft", folder: null, draft_reply: true, description: "Support request -- own it, clarify, solve it" },
  complaint: { action: "draft", folder: null, draft_reply: true, description: "Complaint -- acknowledge, address, ask what they want" },
  spam_nonhuman: { action: "delete", folder: null, draft_reply: false, description: "Non-human spam -- auto delete" },
  spam_human: { action: "archive", folder: null, draft_reply: false, description: "Human spam -- auto archive" },
  billing: { action: "draft", folder: "HITL", draft_reply: true, description: "Billing -- acknowledge, request details, move to HITL" },
  job_seeker: { action: "delete", folder: null, draft_reply: false, description: "Job seeker -- delete" },
  hiring_investor: { action: "draft", folder: null, draft_reply: true, description: "Hiring/investor -- engage, scheduling link" },
  meeting_request: { action: "move_to_folder", folder: "Meeting Requests", draft_reply: false, description: "Meeting request -- park for batch review" },
  thank_you: { action: "draft", folder: null, draft_reply: true, description: "Thank you -- warm ack, gratitude, good vibes" },
  system_notification: { action: "move_to_folder", folder: "System Emails", draft_reply: false, description: "System notification -- folder, daily rundown" },
  introduction: { action: "draft", folder: null, draft_reply: true, description: "Introduction -- full Josh, go the distance" },
  legal: { action: "move_to_folder", folder: "HITL", draft_reply: false, description: "Legal/contracts -- HITL, daily rundown" },
  partnership: { action: "draft", folder: null, draft_reply: true, description: "Partnership -- full Josh, no commits. Collabs folder at commitment" },
  newsletter: { action: "move_to_folder", folder: "Newsletters", draft_reply: false, description: "Newsletter -- folder, no response" },
  personal_suspect: { action: "move_to_folder", folder: "Suspect", draft_reply: false, description: "Personal on business inbox -- Suspect folder" },
  unsubscribe: { action: "draft", folder: "Complaints", draft_reply: true, description: "Unsubscribe -- human ack, archive in Complaints" },
  bounce: { action: "move_to_folder", folder: "Hygiene", draft_reply: false, description: "Bounce -- Hygiene list" },
  refund_cancel: { action: "draft", folder: null, draft_reply: true, description: "Refund -- full Josh, try to save. Approved Refund folder if escalates" },
  follow_up: { action: "draft", folder: null, draft_reply: true, description: "Follow up -- respond with update, Circle Backs if stuck" },
  unclassifiable: { action: "draft", folder: null, draft_reply: true, description: "Unknown -- engage as Josh, ask clarifying Qs" },
};

export const CATEGORY_COLORS: Record<EmailCategory, string> = {
  sales_inquiry: "#2563eb",
  support_request: "#7c3aed",
  complaint: "#dc2626",
  spam_nonhuman: "#6b7280",
  spam_human: "#6b7280",
  billing: "#ca8a04",
  job_seeker: "#6b7280",
  hiring_investor: "#16a34a",
  meeting_request: "#0891b2",
  thank_you: "#16a34a",
  system_notification: "#6b7280",
  introduction: "#2563eb",
  legal: "#dc2626",
  partnership: "#7c3aed",
  newsletter: "#6b7280",
  personal_suspect: "#ea580c",
  unsubscribe: "#ea580c",
  bounce: "#6b7280",
  refund_cancel: "#dc2626",
  follow_up: "#0891b2",
  unclassifiable: "#ca8a04",
};
