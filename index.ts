/**
 * pi-first-prompt: /first-prompt shows this session's initial prompt in the chat,
 * so it can be reused in a fresh session or looped over.
 *
 * The prompt is shown as a display-only entry (never sent to the model, safe mid-run)
 * and published on the `clip:snippet` event, so pi-clip's /clip can copy it raw.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Box, Text } from "@earendil-works/pi-tui";

export const ENTRY_TYPE = "first-prompt";

const textOf = (content: unknown): string =>
  typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content
          .filter((b) => b?.type === "text" && typeof b.text === "string")
          .map((b) => b.text)
          .join("\n")
      : "";

// First user message with text on the current branch, verbatim.
export function firstPrompt(branch: readonly any[]): string | undefined {
  for (const e of branch) {
    if (e?.type !== "message" || e.message?.role !== "user") continue;
    const text = textOf(e.message.content);
    if (text.trim()) return text;
  }
  return undefined;
}

export default function firstPromptExtension(pi: ExtensionAPI) {
  pi.registerEntryRenderer<{ text: string }>(ENTRY_TYPE, (entry, _opts, theme) => {
    const box = new Box(1, 1, (t) => theme.bg("customMessageBg", t));
    box.addChild(new Text(theme.fg("accent", "[first prompt]"), 0, 0));
    box.addChild(new Text(entry.data?.text ?? "", 0, 0));
    return box;
  });

  pi.registerCommand("first-prompt", {
    description: "Show this session's initial prompt (copyable via /clip)",
    handler: async (_args, ctx) => {
      const text = firstPrompt(ctx.sessionManager.getBranch());
      if (!text) return ctx.ui.notify("No initial prompt in this session yet.", "warning");
      pi.appendEntry(ENTRY_TYPE, { text });
      pi.events.emit("clip:snippet", text);
    },
  });
}
