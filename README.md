# pi-first-prompt

Disclaimer: Extension written fully by Pi itself.

Reuse a session's initial prompt in the
[pi](https://www.npmjs.com/package/@earendil-works/pi-coding-agent) coding agent.
Handy for looping over a task, or restarting with fresh context, without
scrolling back through a long session to find the prompt.

## Install

```bash
pi install npm:@grammeaway/pi-first-prompt
```

## Usage

Run `/first-prompt`. The session's first user prompt appears in the chat,
verbatim.

With [pi-clip](https://github.com/grammeaway/pi-clip) installed, the prompt is
also added to the `/clip` picker, so you can copy it raw to your clipboard and
paste it into a new session.

## Notes

- **Display only.** The prompt is shown as a custom session entry and is never
  sent to the model, so `/first-prompt` is safe to run mid-response.
- Reads the current branch of the session tree, so after navigating or forking
  you get that branch's first prompt. Images are left out, text parts are joined.
- Other extensions can pick up the prompt from the `clip:snippet` event on
  `pi.events` (the payload is the prompt string).

## Development

```bash
npm install
npm test
```
