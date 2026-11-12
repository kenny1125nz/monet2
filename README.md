# Monet2

A recursive architecture framework for building and maintaining software with AI agents under human oversight.

Monet2 is the successor to Monet. It focuses on keeping AI-generated systems maintainable by making architecture explicit: components carry a responsibility statement, public interface, dependencies, design, and acceptance criteria. Humans own structural decisions; agents implement and validate leaf components.

## Core ideas

- **Recursive decomposition** — break systems down until each component maps to a single decision boundary.
- **Human-in-the-loop** — humans approve boundaries and trade-offs; AI proposes and implements.
- **Anti-drift feedback** — implementations are measured against the modelled design.
- **Reusable leaves** — low coupling and small interfaces keep lower-level capabilities reusable.

## Getting started

```bash
npm install
npm run build
npm start        # or: npm run dev
```

Provider credentials and runtime settings are configured through environment variables (see `.env.example`), including OpenAI, Anthropic, and Gemini keys.

## Documentation

- `vision.md` — architecture philosophy and approach
- `mvp.md` — essential capabilities
- `capabilities.md` — irreducible capabilities
- `architecture.md` — structural design
- `markdown_based_schem.md` — markdown-based schema notes

## Status

Active design / early implementation.
