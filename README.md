# merit

Microcredit from wallet to wallet: people and financial entities put up
liquidity quotas, and merit lends them to borrowers without a credit history,
scoring them from the movements of their own wallet and collecting a share
of every incoming payment, all over Interledger Open Payments. The money
never passes through merit.

Built on the Interledger test network (`wallet.interledger-test.dev`).

**Status:** the six phases of the [work plan](./spec/definicion/07_plan-de-trabajo.md)
are built and verified locally (75 tests, lint, typecheck, build). What is
still open is the live run on the test network with real approvals; the
exact steps are in each phase's *Verificación*.

Landing: <https://merit-ten-rust.vercel.app>. The app itself (score, loan,
repayment) runs on the demo machine; see *How to run*.

## Documentation

- [`spec/README.md`](./spec/README.md) — start here
- [`spec/definicion/`](./spec/definicion/) — full specification, in Spanish:
  context, solution, design, architecture, technologies, work plan, roadmap,
  brand and SEO
- [`spec/demo.md`](./spec/demo.md) — the three-minute demo script
- [`spec/feedback/`](./spec/feedback/) — what Open Payments documents versus
  what we found
- [`AGENTS.md`](./AGENTS.md) — repository rules and the pre-commit ritual
- [`CHANGELOG.md`](./CHANGELOG.md) — every change, with its evidence

## How it works

Two actors, one page each. Both authorise everything in their own wallet
provider; merit only ever receives tokens scoped and capped by them.

- **Lender** (`/lending`): enters their wallet address and a quota. Their
  provider shows an outgoing-payment grant capped at the quota
  (`limits.debitAmount`); the money stays in their wallet until a loan is
  disbursed from it.
- **Borrower** (`/borrowing`): enters their wallet address. Their provider
  shows a read-only grant over their incoming and outgoing payments; merit
  reads 90 days, computes a score (300–1000) and an offer (max amount, rate,
  max interest), and revokes the read token. The borrower picks an amount,
  authorises a repayment grant capped at `principal + interest`, and the
  principal moves from the lender's wallet to theirs.
- **Repayment service** (`apps/cron`): every 5 seconds, for each active
  loan, reads the borrower's incoming payments since the disbursement and
  moves 20 % of what is new to the lender, never twice for the same unit and
  never above `total_due`. The provider enforces the same cap.

```
 Browser ──► Vercel: landing and SEO only (/, /como-funciona)
     │          └─ buttons → NEXT_PUBLIC_APP_URL
     ▼
 Cloudflare Tunnel ──► apps/web (Next.js on the demo machine)
                         ├─ /lending, /borrowing
                         └─ /api/*: grants, callbacks, score, loans
                                │              │
                                ▼              ▼
                        data/merit.json ◄── apps/cron (repayment loop)
                        (file lock + atomic writes)
                                ▲                 │
                                └── packages/core ┘
                                           │
                                           ▼
                  Open Payments servers of each wallet
                  (auth server: grants · resource server: payments, quotes)
```

## How to run

Prerequisites: Node 22, pnpm 12 through corepack (`corepack enable`), and
four wallets on <https://wallet.interledger-test.dev>: one for merit (with a
developer key: *Settings → Developer keys*), a lender, a borrower and a payer
who sends the borrower money.

```sh
git clone https://github.com/salviega/merit.git && cd merit
corepack enable
pnpm install
cp .env.example .env         # then fill it in; every key is explained inline
pnpm test && pnpm typecheck && pnpm lint && pnpm build
```

Fill `.env` with merit's wallet address, key id and private key (the PEM,
base64 in one line: `base64 < private.key | tr -d '\n'`), a `SESSION_SECRET`
(`openssl rand -hex 32`), the three test wallets, and `APP_URL`:

- **Approving from a browser on the same machine:** `APP_URL=http://localhost:3000`
  is enough. The wallet provider redirects your browser back to merit, so no
  public URL is needed.
- **Approving from a phone or another machine:** run `pnpm tunnel`
  (Cloudflare Tunnel; a named tunnel with `CLOUDFLARE_TUNNEL_TOKEN` keeps a
  fixed hostname) and set `APP_URL` to its public URL.

Then, in three terminals:

```sh
pnpm dev:web          # http://localhost:3000
pnpm dev:cron         # the repayment service, reads data/merit.json every 5 s
pnpm seed:history     # once: pays the borrower wallet several times so it has history to score
```

Walk through the demo in [`spec/demo.md`](./spec/demo.md): the lender
authorises a quota at `/lending`, the borrower gets a score and takes a loan
at `/borrowing`, the payer sends the borrower money and the repayment service
collects the installment within seconds. The state of everything is readable
in `data/merit.json`; tokens are stored there and never leave the machine.

Every screen can also be reviewed without a wallet: `/lending?state=active`,
`/borrowing?state=offer`, and so on, show each state from example data.

## Evidence

- **Tests:** `pnpm test` runs 75 tests in `packages/core` with a coverage
  floor of 85 % enforced by the command. The ones that guard the promise of
  the design — a repayment never exceeds `total_due`, an incoming payment is
  charged at most once, three real processes writing the same store lose
  nothing — are in `repayment.test.ts` and `store.test.ts`.
- **Pull requests:** one per phase, each with what it changed and how it was
  verified: [#4](https://github.com/salviega/merit/pull/4) plan,
  [#5](https://github.com/salviega/merit/pull/5) scaffold,
  [#6](https://github.com/salviega/merit/pull/6) brand and SEO,
  [#7](https://github.com/salviega/merit/pull/7) store, score and history,
  [#8](https://github.com/salviega/merit/pull/8) quotas, loans and
  disbursement, [#9](https://github.com/salviega/merit/pull/9) repayment.
- **Live landing:** <https://merit-ten-rust.vercel.app> with the Open Graph
  card, `robots.txt`, `sitemap.xml` and JSON-LD.
- **Test network:** payment and grant URLs from the live run go into
  `CHANGELOG.md` as they happen (its header states the convention).

## Security in one paragraph

Access tokens, `manage` URLs and merit's private key never reach the browser
or the repo: the browser receives redirect URLs and summaries of its own
rows, tied to signed `httpOnly` cookies. Every interactive grant uses a fresh
nonce and its callback verifies the provider's `hash` before the grant is
continued. Every outgoing payment spends a token from a grant the wallet
owner approved with a cap they saw. Every write to the store goes through
one transaction under a file lock.

## License

MIT, see [`LICENSE`](./LICENSE).
