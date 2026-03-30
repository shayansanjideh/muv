---
description: Set up muv — create or import a Movement blockchain wallet
---

You are helping the user set up muv for the first time. muv gives you Movement blockchain superpowers — checking balances, swapping tokens on Meridian DEX, and transferring MOVE.

## Steps

1. **Check if wallet already exists** — call the `get_wallet_info` tool. If it returns an address, tell the user they're already set up and show their address. Skip to step 4.

2. **Ask the user how they want to set up their wallet:**
   - **Generate a new wallet** — Run this script to generate one:
     ```bash
     node -e "
     const { Account } = require('@aptos-labs/ts-sdk');
     const fs = require('fs');
     const path = require('path');
     const dir = process.env.MUV_CONFIG_DIR || path.join(process.env.HOME, '.config', 'muv');
     fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
     const account = Account.generate();
     const data = { address: account.accountAddress.toString(), privateKey: Buffer.from(account.privateKey.toUint8Array()).toString('hex') };
     fs.writeFileSync(path.join(dir, 'wallet.json'), JSON.stringify(data, null, 2), { mode: 0o600 });
     console.log('Wallet created: ' + data.address);
     console.log('Private key saved to: ' + path.join(dir, 'wallet.json'));
     console.log('IMPORTANT: Back this file up. If you lose it, your funds are gone.');
     "
     ```
   - **Import an existing private key** — Ask for their hex private key, then save it the same way.

3. **Verify** — Call `get_wallet_info` to confirm the wallet is configured.

4. **Done!** Tell the user they can now ask things like:
   - "What's my MOVE balance?"
   - "Show all my token balances"
   - "Swap 10 USDC.e for MOVE on Meridian"
   - "Send 5 MOVE to 0x..."
   - "What is Movement?"
