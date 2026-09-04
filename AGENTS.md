## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

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
- Plain, technical vocabulary. No marketing buzzwords, no hype adjectives ("amazing", "cutting-edge", "seamless").
- Contractions throughout: "I'll", "don't", "it's", "I'm".
- States facts and decisions plainly, without hedging: "Fixed in v0.19.0." not "This should hopefully be resolved
  now." Own the claim.
- Comfortable being blunt when the situation calls for it, without being rude.
- First person, framed around concrete ownership of the work: "I designed and built X", "I led the architecture",
  not passive ("X was designed").
- Short paragraphs. Long technical explanations are structured (bold lead-ins, numbered causes) but never padded:
  no restating the question before answering it.
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

For explainer/tutorial-style posts specifically (older sample: a 2017 guest post on setting up Windows for
front-end dev), he explains *why* something is worth doing before walking through *how*, and closes on a warm,
forward-looking note rather than a hard sign-off. That older piece also leaned on more exclamation points than his
current GitHub/Reddit writing, but that reads as genre-and-era drift rather than his present voice, so it does not
override the "no exclamation points by default" rule above.
