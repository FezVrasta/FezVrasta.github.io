## Development

**Keep exactly one dev server running for the whole session, on the default port
(4321).** Federico wants it always up while working on this site, so he can check the
browser himself without asking for it to be started again.

- Before starting one, check `astro dev status` (or `lsof -nP -iTCP -sTCP:LISTEN | grep 432`)
  so you don't spawn a second server on a different port and leave the first one orphaned.
  If one is already running and healthy, use it, don't restart it.
- Content and style edits hot-reload on their own. Don't stop/restart the server just
  because you changed an `.astro` or `.mdx` file.
- A restart is only needed after editing `astro.config.mjs`/`content.config.ts`, or after
  clearing `.astro`/`node_modules/.astro`. Even then: `astro dev stop` first, then start
  fresh, so it lands back on 4321 instead of drifting to 4322/4323/etc.
- Use background mode:

  ```
  astro dev --background
  ```

- Never leave more than one dev server (or leftover one-off servers like `python3 -m
  http.server`) listening at session end. Clean up strays as soon as you notice them.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Writing voice

All copy on this site (hero, bios, blog posts, disclaimers, anything user-facing) should sound like Federico actually
wrote it. Derived from his GitHub issue/PR replies, LinkedIn experience blurbs, and his Reddit comments and posts
(u/FezVrasta, mostly r/homeassistant).

**Never use em dashes ("—" or " -- "). Not once, not even for an aside.** Rewrite the sentence instead: split it into
two sentences, use a comma, use parentheses, or use a colon. This is a hard rule, not a style preference.

Other traits to match:

- Terse and direct. Get to the point in the first sentence, no throat-clearing ("Great question!", "I'm excited to
  share...", "Here's the part I want to be upfront about:", "I want to be clear that..."). Just say the thing.
- **Never narrate your own honesty or directness.** No "I'd rather say that plainly", "to be honest", "let me be
  transparent", "I'll be direct here". If a sentence describes the *manner* in which you're about to say something
  rather than the thing itself, delete it and just say the thing. This applies even when the surrounding claim
  (a limitation, an admission) is exactly the kind of thing worth being upfront about, the fix is to state the fact
  and stop, not to comment on the act of stating it.
- Plain, technical vocabulary. No marketing buzzwords, no hype adjectives ("amazing", "cutting-edge", "seamless").
- Contractions throughout: "I'll", "don't", "it's", "I'm".
- States facts and decisions plainly, without hedging: "Fixed in v0.19.0." not "This should hopefully be resolved
  now." Own the claim.
- Comfortable being blunt when the situation calls for it, without being rude.
- First person, framed around concrete ownership of the work: "I designed and built X", "I led the architecture",
  not passive ("X was designed").
- Short paragraphs. Long technical explanations are structured (bold lead-ins, numbered causes) but never padded:
  no restating the question before answering it.
- **Bold lead-ins are short noun phrases, never imperative sentences.** "**The crash.**" or "**The script.**",
  not "**Never poll an admin-authenticated command.**". An imperative reads like a doc's rule of thumb; a noun
  phrase reads like a person pointing at the next thing in their own story. This matters most right after a
  first-person sentence, an instruction-voiced lead-in there breaks the narrative "I" the paragraph was just in.
- No exclamation points as a default. When one shows up, it's tied to a specific concrete detail he's genuinely glad
  about ("Everything MIT licensed!"), never generic hype ("Amazing news!").
- Asides go in parentheses, not between dashes. Related but separate thoughts get their own sentence instead of being
  chained together.
- A little grammatical looseness is fine and reads as authentic (dropped commas, a sentence fragment). Don't over-polish
  short remarks into corporate copy-editing.

Longer posts (the shape a blog post should take) follow a specific structure, seen consistently in his own project-
announcement writing:

1. Open with the concrete problem or motivation, one or two sentences, before mentioning the solution: "I've been
   doing X, but I wanted Y, so..."
2. Name what existing options he looked at and why they fell short, plainly and without dunking on them.
3. Describe what he built and how, still in plain terms: no architecture-diagram language for a blog post.
4. State any real limitation or tradeoff outright, unprompted. Never bury or omit the downside.
5. End with a link and, often, a genuine open question to the reader rather than a call to action.

**On a technical project, the research (repo docs, PR review threads, protocol specs) will hand you a pile of
real implementation detail: algorithm names, internal function/class names, library-specific jargon, code review
back-and-forth. Almost none of it belongs in the post.** A blog post is not the documentation. Translate every
technical fact into what it means and why it mattered, not the vocabulary it came dressed in:
- Not "AES-128-CBC with a CBC-MAC, ECDH on SECP224R1", instead "it's genuinely encrypted, not just obscured."
- Not "`zwave_js` gates `set_user`/`delete_user` as admin-only because `switch.turn_on` only needs
  entity-control permission", instead "opening the door and managing who's allowed to open it are different
  levels of trust."
- Not naming the specific framework method that had to be overridden and why, instead "the same crash could come
  back a different way, so I closed that path too."
One well-chosen technical detail can still land (a protocol name, a specific crash symptom, a real error message)
when it's the single most concrete way to say the thing. A paragraph of acronyms and API names is never that.
If a draft needs a glossary to be readable, that is the signal to cut, not to add a parenthetical explaining the
jargon.

For explainer/tutorial-style posts specifically (older sample: a 2017 guest post on setting up Windows for
front-end dev), he explains *why* something is worth doing before walking through *how*, and closes on a warm,
forward-looking note rather than a hard sign-off. That older piece also leaned on more exclamation points than his
current GitHub/Reddit writing, but that reads as genre-and-era drift rather than his present voice, so it does not
override the "no exclamation points by default" rule above.

## Researching a blog post

When writing a post about one of Federico's own projects, don't work from memory or from the README alone. The
real story (the actual problem, the false starts, the thing that broke) is scattered across three places. Check
all three before drafting:

**GitHub.** Not just the README:
- `gh repo view <owner>/<repo> --json description,createdAt` for the actual timeline.
- `gh api repos/<owner>/<repo>/commits --paginate -q '.[] | "\(.commit.author.date) \(.commit.message | split("\n")[0])"'`
  read in *reverse* (oldest first). Commit messages narrate the real build order, including rewrites and the
  crash/bug that caused them, better than any doc does.
- Any `PROTOCOL.md`, `DEVELOPERS.md`, `FIRMWARE.md`, or similar docs file in the repo, these often hold the
  hard-won technical detail that never made it into the README.
- `gh search prs --author FezVrasta` / `gh api "search/issues?q=type:pr+author:FezVrasta+<keyword>"` for PRs on
  forks or upstream repos he contributed to, not just his own repos, plus the discussion on those PRs.
- Related/upstream projects (a fork he sent a PR to, the core project he upstreamed into) for the reviewer
  feedback and scope negotiation, that's usually the most honest "what shipped vs. what I wanted" material.

**Reddit** (u/FezVrasta). Search his **submitted posts**, not just comments:
`https://www.reddit.com/user/FezVrasta/submitted/`. Announcement posts there are often the first-person origin
story in his own words (why he built something, what he tried first), written in the voice this guide describes.
Comments are useful for terse-voice samples but rarely carry the founding narrative.

**Claude chat history**, under `~/.claude/projects/`. Each project directory name is the working directory path
with `/` replaced by `-` (e.g. `~/Developer/ha-rbac` → `-Users-federicozivolo-Developer-ha-rbac`). Inside:
- A `memory/` subdirectory, if present, has distilled project facts, read `MEMORY.md` first.
- The `.jsonl` session transcripts are the raw conversations. Each line is a JSON object; user/assistant turns
  have `type` and a `message.content` array of `{type: "text", text: ...}` blocks, plus a `timestamp` field
  (file *mtime* is when the session was last written to, not when it started, don't sort by it).
- **The origin conversation is often not in the project's own directory.** If the repo's own project dir starts
  mid-stream (e.g. polishing a README), the founding conversation, where the idea was actually pitched, happened
  earlier, before that directory existed or from a different cwd. Search across *all* project directories for an
  early mention: `grep -rl "<keyword>" ~/.claude/projects/*/*.jsonl`, then sort candidates by their first
  in-file `timestamp` (not filename, not mtime) to find the true earliest one. The first user message of that
  earliest session is usually the actual pitch, worth quoting or paraphrasing closely.
- Some ground truth predates any Claude Code session entirely (protocol reverse-engineering done by hand, a
  decompiled APK, hardware bought before automation started). When commit history already has full working
  functionality on day one, don't force a chat-history narrative that doesn't exist, say what the artifacts
  actually show instead (e.g. decompiled class names surviving into the shipped code are themselves evidence of
  the method, cite that rather than a conversation that isn't there).
