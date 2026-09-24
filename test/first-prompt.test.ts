import { test } from "node:test";
import assert from "node:assert/strict";
import ext, { firstPrompt, ENTRY_TYPE } from "../index.ts";

const user = (content: unknown) => ({ type: "message", message: { role: "user", content } });
const assistant = (text: string) => ({ type: "message", message: { role: "assistant", content: [{ type: "text", text }] } });

test("firstPrompt returns the first user text verbatim", () => {
  const prompt = "  loop over this\n```sh\nls\n```\n";
  assert.equal(firstPrompt([user(prompt), assistant("ok"), user("second")]), prompt);
});

test("firstPrompt joins text parts, drops images, skips image-only and non-message entries", () => {
  const branch = [
    { type: "custom", customType: ENTRY_TYPE, data: { text: "old" } },
    user([{ type: "image", data: "x" }]),
    user([{ type: "text", text: "a" }, { type: "image", data: "x" }, { type: "text", text: "b" }]),
  ];
  assert.equal(firstPrompt(branch), "a\nb");
});

test("firstPrompt is undefined without a user prompt", () => {
  assert.equal(firstPrompt([]), undefined);
  assert.equal(firstPrompt([assistant("hi"), user("   ")]), undefined);
});

function harness(branch: any[]) {
  let command: any, renderer: any;
  const entries: any[] = [], emitted: any[] = [], notes: any[] = [];
  const pi: any = {
    registerCommand: (_: string, c: any) => (command = c),
    registerEntryRenderer: (_: string, r: any) => (renderer = r),
    appendEntry: (customType: string, data: unknown) => entries.push({ customType, data }),
    events: { emit: (channel: string, data: unknown) => emitted.push({ channel, data }) },
  };
  ext(pi);
  const ctx = { sessionManager: { getBranch: () => branch }, ui: { notify: (msg: string, level: string) => notes.push({ msg, level }) } };
  return { entries, emitted, notes, renderer, run: () => command.handler("", ctx) };
}

test("/first-prompt shows the prompt and hands it to pi-clip", async () => {
  const h = harness([user("do the thing"), assistant("done")]);
  await h.run();
  assert.deepEqual(h.entries, [{ customType: ENTRY_TYPE, data: { text: "do the thing" } }]);
  assert.deepEqual(h.emitted, [{ channel: "clip:snippet", data: "do the thing" }]);
});

test("/first-prompt warns and does nothing on an empty session", async () => {
  const h = harness([]);
  await h.run();
  assert.equal(h.entries.length + h.emitted.length, 0);
  assert.equal(h.notes[0].level, "warning");
});

test("renderer shows every line of the prompt", () => {
  const h = harness([]);
  const theme = { fg: (_: string, t: string) => t, bg: (_: string, t: string) => t };
  const lines: string[] = h.renderer({ data: { text: "line one\nline two" } }, { expanded: false }, theme).render(80);
  const out = lines.join("\n");
  for (const s of ["[first prompt]", "line one", "line two"]) assert.ok(out.includes(s), `missing ${s} in:\n${out}`);
});
