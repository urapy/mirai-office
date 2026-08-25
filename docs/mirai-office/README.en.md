# Mirai Office

[日本語](README.md)

Mirai Office is a web application that helps children understand long-term investing as a way for money to support real work in society. A guardian manages the simulated account, while the child explores pixel-art workplaces where companies and teams carry out their day-to-day activities.

The project is built on a fork of [Pixel Agents](https://github.com/pixel-agents-hq/pixel-agents). It reuses the canvas renderer, character state machine, pathfinding, and office editor while adding a child-facing learning experience and a separate guardian-facing simulated brokerage account.

## Current prototype

The current vertical slice includes:

- A completely simulated account with reproducible real-time prices
- Separate child and guardian interfaces
- Fictional finance, IT, and manufacturing funds
- A dedicated workplace for each sector
- Characters that arrive, work, move around the office, and react to typed company events
- Guardian-triggered learning scenarios such as rapid growth, steady operation, or a major challenge
- Mobile layouts suitable for viewing through a private Tailscale connection
- An experimental NVIDIA company-watch room backed by NVIDIA's official Newsroom RSS feed

NVIDIA is kept separate from the simulated products. It cannot be purchased through the virtual brokerage account. The company-watch feature reads the latest official press release, classifies the type of company activity, and presents three child-friendly sections: what happened, what it means, and what to watch next.

The first company-watch version uses reviewed rules and templates rather than free-form generative AI. It does not predict share prices, rank companies, or recommend buying or selling.

## Product principles

- Keep the child interface and guardian controls clearly separated.
- Show principal, valuation, profit, and loss accurately, even on the child screen.
- Do not connect daily price changes to a character's happiness or personal failure.
- Do not encourage frequent trading, gambling-like behavior, or guaranteed-return expectations.
- Do not store real names, account numbers, credentials, or secrets in the MVP.
- Any future real brokerage integration should be read-only and must not place trades or withdraw funds.
- Keep API keys and other secrets out of the frontend, logs, local storage, and repository.

## Local development

Requirements:

- Node.js 20 or later
- npm

Install dependencies and start the complete local experience:

```bash
npm install
npm run dev:mirai
```

Then open:

- Child-facing Mirai Office: `http://127.0.0.1:5173/`
- Guardian-facing simulated brokerage: `http://127.0.0.1:5174/`
- Local simulation API: `http://127.0.0.1:4310/`

The NVIDIA company-watch endpoint is available at:

```text
http://127.0.0.1:4310/api/company-watch/nvidia
```

## Verification

The main local checks are:

```bash
npm --workspace simulation-server test
npm --workspace webview-ui test
npm --workspace webview-ui run build
npm run lint
```

Firebase Functions are an optional deployment prototype and are not required for local development. Do not build or deploy Firebase services as part of the normal workflow without explicit approval because the deployed service may use usage-based billing.

## Repository structure

- `webview-ui/` — child-facing pixel office and account summary
- `brokerage-ui/` — guardian-facing simulated brokerage interface
- `simulation-server/` — local virtual market, account, events, and company-watch API
- `functions/` — optional Firebase Functions prototype
- `docs/mirai-office/` — product requirements, security boundaries, research, and decisions
- `core/`, `server/`, `adapters/` — upstream Pixel Agents architecture

## Documentation

- [Concept](concept.md) — Japanese
- [MVP requirements](requirements.md) — Japanese
- [Security policy](security-policy.md) — Japanese
- [Real-time brokerage architecture](realtime-brokerage-architecture.md) — Japanese
- [Performance events](performance-events.md) — Japanese
- [NVIDIA company-watch prototype](company-watch-nvidia.md) — Japanese
- [Remote iPhone preview](remote-preview.md) — Japanese

## Status and scope

The initial MVP remains an educational simulation and does not connect to a real securities account. The NVIDIA room is an isolated research prototype for understanding public company activity from official sources; it is not a securities-data integration and is not investment advice.

## License and attribution

The upstream Pixel Agents code is distributed under the [MIT License](../../LICENSE). Mirai Office changes are being developed in the `codex/mirai-office-mvp` branch of the `urapy/pixel-agents` fork. Review asset licenses and trademark usage before any public product release.
