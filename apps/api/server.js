// Minimal PoC: can a third party (e.g. an accountant) get read-only access
// to a user's Open Payments transaction history via an interactive grant?
//
// Flow:
//   GET /share?wallet=<user wallet address>  -> redirects user to their wallet's consent screen
//   GET /callback                             -> wallet redirects back here after consent
//   GET /history                              -> lists all incoming + outgoing payments (JSON)
//   GET /history.csv                          -> same, as CSV
//   POST /revoke                              -> cancels the grant
import 'dotenv/config'
import crypto from 'node:crypto'
import express from 'express'
import { createAuthenticatedClient, isFinalizedGrant } from '@interledger/open-payments'

const {
  PORT = 3000,
  CLIENT_WALLET_ADDRESS, // the accountant's (client's) wallet address
  KEY_ID, // key id registered on that wallet address
  PRIVATE_KEY_PATH = './private.key'
} = process.env

const client = await createAuthenticatedClient({
  walletAddressUrl: CLIENT_WALLET_ADDRESS,
  keyId: KEY_ID,
  privateKey: PRIVATE_KEY_PATH
})

// In-memory state; fine for a single-user PoC.
const state = { pending: null, walletAddress: null, accessToken: null, manageUrl: null }

const app = express()

app.get('/share', async (req, res, next) => {
  try {
    const walletAddress = await client.walletAddress.get({ url: req.query.wallet })
    const nonce = crypto.randomUUID()

    // Read-only: list/read (+ -all variants) on both payment types, no create.
    const grant = await client.grant.request(
      { url: walletAddress.authServer },
      {
        access_token: {
          access: [
            {
              type: 'incoming-payment',
              actions: ['list', 'list-all', 'read', 'read-all'],
              identifier: walletAddress.id
            },
            {
              type: 'outgoing-payment',
              actions: ['list', 'list-all', 'read', 'read-all'],
              identifier: walletAddress.id
            }
          ]
        },
        interact: {
          start: ['redirect'],
          finish: { method: 'redirect', uri: `http://localhost:${PORT}/callback`, nonce }
        }
      }
    )

    state.walletAddress = walletAddress
    state.pending = grant
    res.redirect(grant.interact.redirect)
  } catch (err) {
    next(err)
  }
})

app.get('/callback', async (req, res, next) => {
  try {
    if (!state.pending) return res.status(400).send('No pending grant')
    if (req.query.result === 'grant_rejected') return res.status(403).send('User rejected the grant')

    const grant = await client.grant.continue(
      {
        url: state.pending.continue.uri,
        accessToken: state.pending.continue.access_token.value
      },
      { interact_ref: req.query.interact_ref }
    )
    if (!isFinalizedGrant(grant)) return res.status(500).send('Grant not finalized')

    state.accessToken = grant.access_token.value
    state.manageUrl = grant.access_token.manage
    state.pending = null
    } catch (err) {
    next(err)
  }
})

async function listAll(resource) {
  const items = []
  let cursor
  do {
    const page = await client[resource].list(
      {
        url: state.walletAddress.resourceServer,
        walletAddress: state.walletAddress.id,
        accessToken: state.accessToken
      },
      { first: 100, ...(cursor && { cursor }) }
    )
    items.push(...page.result)
    cursor = page.pagination.hasNextPage ? page.pagination.endCursor : undefined
  } while (cursor)
  return items
}

async function getHistory() {
  const [incoming, outgoing] = await Promise.all([
    listAll('incomingPayment'),
    listAll('outgoingPayment')
  ])
  return { incoming, outgoing }
}

function requireToken(req, res, next) {
  if (!state.accessToken) return res.status(401).send('No grant yet. Start at /share?wallet=<url>')
  next()
}

app.get('/history', requireToken, async (req, res, next) => {
  try {
    const { incoming, outgoing } = await getHistory()
    res.json({ counts: { incoming: incoming.length, outgoing: outgoing.length }, incoming, outgoing })
  } catch (err) {
    next(err)
  }
})

app.get('/history.csv', requireToken, async (req, res, next) => {
  try {
    const { incoming, outgoing } = await getHistory()
    const rows = [
      ...incoming.map((p) => ['incoming', p.id, p.createdAt, p.receivedAmount?.value, p.receivedAmount?.assetCode, p.receivedAmount?.assetScale, p.completed]),
      ...outgoing.map((p) => ['outgoing', p.id, p.createdAt, p.sentAmount?.value, p.sentAmount?.assetCode, p.sentAmount?.assetScale, !p.failed]),
    ].sort((a, b) => a[2].localeCompare(b[2]))
    const csv = [['direction', 'id', 'createdAt', 'amount', 'assetCode', 'assetScale', 'ok'], ...rows]
      .map((r) => r.map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n')
    res.type('text/csv').attachment('history.csv').send(csv)
  } catch (err) {
    next(err)
  }
})

app.post('/revoke', requireToken, async (req, res, next) => {
  try {
    await client.token.revoke({ url: state.manageUrl, accessToken: state.accessToken })
    state.accessToken = null
    res.send('Revoked')
  } catch (err) {
    next(err)
  }
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: err.message, description: err.description, status: err.status })
})

app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`))
