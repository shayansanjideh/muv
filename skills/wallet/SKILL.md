---
description: Show wallet address and balances
---

Show the user's Movement wallet info:

1. Call `get_wallet_info` to get the wallet address
2. Call `get_balances` (with no wallet_address param) to get all token balances
3. Display the wallet address and balances in a clean format

If no wallet is configured, tell the user to run `/muv:setup` first.
