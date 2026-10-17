# Research notes: sharing Interledger / Open Payments history with an accountant

(Stored verbatim-in-substance from the user's prior research, 2026-10-16.)

**Question:** I'm an Interledger user with 100 transactions in my wallet. Can I share my ledger with an external user (e.g. my accountant)?

**Answer: Yes.** Open Payments (OP) lets third parties, with account-holder consent, initiate payments and *view transaction history*. The "view history" half is what's needed.

## Framing correction
There is no shared "Interledger ledger". Transactions live only at the wallet provider (Account Servicing Entity, ASE). OP is the standard API that provider exposes so an authorized client can read them. Real question: can the accountant get read-only API access to my wallet's payment history? Yes, if the provider implements the spec fully.

## How it works
1. The accountant (or their software) is an **OP client**: needs its own wallet address with a published key (JWKS) to sign requests (HTTP message signatures).
2. Client sends a **grant request** to my wallet's authorization server. Access types `incoming-payment` and `outgoing-payment`; actions `read`, `read-all`, `list`, `list-all`. Read-only history grant = `list-all` + `read-all` on both types, **no `create`**.
3. Grant is **interactive**: wallet redirects me to a consent screen; I approve. Anything touching sent (outgoing) payments requires an interactive grant. On approval, client gets an access token.
4. With the token, client lists incoming + outgoing payments (paginated) and fetches details per payment. SDKs expose this directly (e.g. PHP `ip:list`, `op:list`; Node `@interledger/open-payments`).
5. I can **revoke** the grant any time (grant cancel); tokens are scoped and expire.

## Three paths (most → least work)
1. **Proper delegated access** – accountant's software is a registered OP client; I consent once; they pull on demand. Needs OP-aware accounting software (rare) or the accountant running a script. Provider must support `list-all` (Rafiki test wallet does; commercial providers may not).
2. **Run the client myself** – ~50-line Node script with `@interledger/open-payments` listing incoming + outgoing payments → CSV → hand to accountant. ~1 day of work; no Interledger tooling needed by accountant.
3. **Provider UI export** – most wallets have statement/CSV export. Check first.

## Caveats
- OP only returns payments that went through OP resources. Top-ups, fees, internal transfers may not appear. Provider's own export is the authoritative ledger.
- `list-all` support is provider-dependent; some only let a client list payments it created.
- No "share with user X" concept at the wallet level. Delegation is strictly client-key + grant → accountant must have a client identity.

**Recommendation:** unless the accountant has OP-aware software, use path 2 (script the export, give CSV).
