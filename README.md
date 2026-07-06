# The Art of Soulcraft

*artofsoulcraft.com — a BridgeTender Studio project*

A twelve-archetype developmental self-discovery system. You are not one type — you are all twelve, some louder than others. Every archetype exists on a five-stage spectrum from selfish (Devolved) to selfless (Transcendent). A mirror, not a fortune.

---

## 🚦 Status: Pre-Launch — Architecture Complete, Build In Progress

**This is NOT yet a live, working product.** Here's the honest state as of July 2026:

### ✅ Done
- Full conceptual architecture: 12 archetypes, 5 stages, 48 base×embodiment expressions, 66 named blends
- The Wheel / Clock / Cone geometry
- Instrument design: graded 5-point forced-pair format, tie-cascade logic, Quick (36) vs Full (66) specs
- Working front-end prototype (`/prototype`) — assessment flow, live scoring, mandala rendering, print-to-PDF
- Full backend specification — database schema, Stripe flow, sharing mechanics (see `/docs/build-spec.md`)
- Brand, domain (artofsoulcraft.com), tier pricing (Free/Reveal $9/Full $19)

### ❌ Not Done Yet
- **No backend code written** — only specified. The three core server functions (save results, verify magic link, Stripe webhook) do not exist yet.
- **No database created** — schema is designed, not deployed.
- **No Stripe account/products set up.**
- **The 36-statement bank is unwritten** — the Full Mirror currently reuses single statements per archetype across multiple pairings, which is a known placeholder, not final content.
- **No deployment** — nothing is live at the domain yet.
- **No user testing** — the prototype has only been used by the project's creator.
- **Book content, physical deck, portraits** — all explicitly deferred, not required for a v1 web launch.

**Bottom line: the hard creative problem (the system itself) is solved. What's left is execution — writing the remaining content and building the backend.**

---

## Repo Structure

```
/prototype        — working React prototype (assessment + mandala + results)
/docs
  /build-spec.md  — full backend spec: schema, Stripe flow, Wrapped Card, ecosystem
  /canon.md       — the 12/48/66, geometry, philosophy (source of truth for content)
```

---

## Next Steps, In Order

1. Write the 36-statement bank (3 flavors × 12 archetypes)
2. Set up Stripe account + Free/Reveal/Full price tiers
3. Build the three core backend functions per `/docs/build-spec.md`
4. Set up the database (Cloudflare D1 or equivalent) per the schema in the build spec
5. Deploy to artofsoulcraft.com
6. Friend/beta testing before any public or paid launch
7. Only then: Wrapped Card social sharing, Compatibility Report, book, deck

---

## Canon Reference

The full system architecture, decisions log, and open questions are maintained in Notion (BridgeTender Studio workspace → Archetypes — The Twelve) and mirrored in `/docs/canon.md` in this repo. Notion is the living source of truth; this repo should be kept in sync with it, not the other way around.
