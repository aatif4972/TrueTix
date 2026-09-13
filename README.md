# TrueTix — anti-scalping NFT event tickets

Built for ETHOnline.

## The problem

Event ticketing has two chronic problems: scalping (tickets resold far above
face value, with the organizer seeing none of it) and fraud (duplicated or
fake tickets at the door). Centralized ticketing platforms "solve" this with
their own opaque anti-bot systems and take a cut of everything, including
resale, without giving organizers or fans any visibility into the rules.

## The idea

Every ticket is minted as an ERC-721 NFT. The only way to resell it is
through a dedicated on-chain marketplace that:

- **Caps the resale price** at a percentage of face value the organizer sets
  at creation (e.g. 110%) — a $20 ticket can never quietly become a $400 one.
- **Pays the organizer a royalty automatically** on every resale (e.g. 5%),
  so secondary sales stop being pure value leakage.
- **Marks tickets used on-chain at check-in**, so a ticket can't be resold or
  reused after someone has already walked through the gate, and duplicate
  tickets are impossible to check in twice.

No off-chain database of "valid" tickets, no trust required in the
platform's word for who owns what — the chain is the source of truth.

## Architecture

```
contracts/
  EventTicketNFT.sol    ERC-721 tickets for one event: primary sale (mint),
                         check-in, resale-cap math, organizer withdrawal.
  TicketMarketplace.sol Escrow-based resale: enforces the price cap, splits
                         payment between seller and organizer royalty.
  TicketFactory.sol      Deploys a new EventTicketNFT per event and keeps a
                         public registry so a frontend can discover events.
```

Frontend: a single-page app (`frontend/index.html`) using ethers.js and
MetaMask — connect wallet, browse events, mint, list/buy resales, and a gate
check-in panel for organizers. Ticket-stub visual theme, no build step.

## Running it

```bash
npm install
```

**Compile.** This environment's sandbox couldn't reach
`binaries.soliditylang.org` to fetch Hardhat's usual Solidity compiler
binary, so `compile.js` compiles with the plain `solc` npm package instead
(solc ships as a self-contained package, so this works offline / behind
restrictive firewalls too). On your own machine with normal internet access,
`npx hardhat compile` will also work — either is fine, `compile.js` is just
more portable:

```bash
node compile.js        # writes ABI + bytecode to build/
```

**Test** (19 tests covering minting, sold-out, resale cap enforcement,
royalty splits, check-in, and the factory):

```bash
npx mocha test/*.test.js --timeout 60000
```

**Deploy locally** (spins up an in-process Hardhat network, deploys
everything, and creates one demo event):

```bash
node scripts/deploy.js
```

Copy the printed `TicketFactory` and `TicketMarketplace` addresses into the
frontend's "Contract addresses" box.

**Deploy to a testnet (Sepolia)** for the live demo. Create a `.env` with:

```
SEPOLIA_RPC_URL=https://... (Alchemy/Infura/etc.)
PRIVATE_KEY=0x...
```

then, to skip Hardhat's own compile step and reuse the artifacts from
`compile.js`:

```bash
HARDHAT_NETWORK=sepolia node scripts/deploy.js
```

**Run the frontend** — it's a static file, so just open it, or serve it:

```bash
npx http-server frontend
```

You'll need MetaMask pointed at whichever network you deployed to (add
`http://127.0.0.1:8545` as a custom network for local testing, chain ID
31337).

## Demo script for judges

1. Connect wallet, paste factory/marketplace addresses.
2. Mint a ticket for the demo event at face value.
3. List it for resale at the cap — show the contract rejects a price above it.
4. Buy it from a second wallet — show the royalty landing in the organizer's
   balance automatically.
5. Check the ticket in from the organizer wallet — show a second check-in
   attempt reverting, and that it can no longer be listed.

## Possible extensions

- Soulbound "attendance badge" NFT minted automatically on check-in.
- Allowlist / waitlist mint phases for high-demand events.
- Fiat on-ramp so non-crypto-native attendees can still buy in ETH under the
  hood.
- Subgraph indexing instead of the frontend's brute-force event/log scanning,
  for events with large ticket counts.

## Notes on the code

- Uses OpenZeppelin Contracts v5 (`Ownable`, `ERC721`, `ReentrancyGuard`).
- Custom errors instead of `require` strings, for cheaper reverts.
- `TicketFactory` deploys a full contract per event (not a minimal proxy) to
  keep the code simple to read and audit within a hackathon's time budget —
  swapping in EIP-1167 clones later is a drop-in optimization if gas costs
  from many events become a concern.
