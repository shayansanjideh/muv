export interface TokenInfo {
  symbol: string;
  name: string;
  faAddress: string;
  decimals: number;
}

export const TOKEN_REGISTRY: TokenInfo[] = [
  // Core tokens
  { symbol: "MOVE", name: "Move", faAddress: "0x000000000000000000000000000000000000000000000000000000000000000a", decimals: 8 },
  { symbol: "USDT.e", name: "Tether USD (Bridged)", faAddress: "0x447721a30109c662dde9c73a0c2c9c9c459fb5e5a9c92f03c50fa69737f5d08d", decimals: 6 },
  { symbol: "USDCx", name: "USD Coin (Native)", faAddress: "0xba11833544a2f99eec743f41a228ca6ffa7f13c3b6b04681d5a79a8b75ff225e", decimals: 6 },
  { symbol: "USDC.e", name: "USD Coin (Bridged)", faAddress: "0x83121c9f9b0527d1f056e21a950d6bf3b9e9e2e8353d0e95ccea726713cbea39", decimals: 6 },
  { symbol: "WETH.e", name: "Wrapped Ether (Bridged)", faAddress: "0x908828f4fb0213d4034c3ded1630bbd904e8a3a6bf3c63270887f0b06653a376", decimals: 8 },
  { symbol: "WBTC.e", name: "Wrapped Bitcoin (Bridged)", faAddress: "0xb06f29f24dde9c6daeec1f930f14a441a8d6c0fbea590725e88b340af3e1939c", decimals: 8 },
  { symbol: "USDe", name: "USDe", faAddress: "0x9d146a4c9472a7e7b0dbc72da0eafb02b54173a956ef22a9fba29756f8661c6c", decimals: 6 },
  { symbol: "sUSDe", name: "Staked USDe", faAddress: "0x74f0c7504507f7357f8a218cc70ce3fc0f4b4e9eb8474e53ca778cb1e0c6dcc5", decimals: 6 },
  { symbol: "USDa", name: "USDa", faAddress: "0x48b904a97eafd065ced05168ec44638a63e1e3bcaec49699f6b8dabbd1424650", decimals: 8 },
  { symbol: "sUSDa", name: "Staked USDa", faAddress: "0xe699e6c1733462632821b6e5b954c0ed3aa9ad1efb70b6ce92616952ade89258", decimals: 8 },
  { symbol: "LBTC", name: "Lombard BTC", faAddress: "0x0658f4ef6f76c8eeffdc06a30946f3f06723a7f9532e2413312b2a612183759c", decimals: 8 },
  { symbol: "stBTC", name: "Staked BTC", faAddress: "0x95c0fd13373299ada1b9f09ff62473ab8b3908e6a30011730210c141dffdc990", decimals: 8 },
  { symbol: "enzoBTC", name: "Enzo BTC", faAddress: "0xff91f0df99b217436229b85ae900a2b67970eda92a88b06eb305949ec9828ed6", decimals: 8 },
  { symbol: "solvBTC", name: "Solv BTC", faAddress: "0x527c43638a6c389a9ad702e7085f31c48223624d5102a5207dfab861f482c46d", decimals: 8 },
  { symbol: "ezETH", name: "Renzo ezETH", faAddress: "0x2f6af255328fe11b88d840d1e367e946ccd16bd7ebddd6ee7e2ef9f7ae0c53ef", decimals: 8 },
  { symbol: "rsETH", name: "KelpDAO rsETH", faAddress: "0x51ffc9885233adf3dd411078cad57535ed1982013dc82d9d6c433a55f2e0035d", decimals: 8 },
  { symbol: "weETH", name: "Wrapped eETH", faAddress: "0xe956f5062c3b9cba00e82dc775d29acf739ffa1e612e619062423b58afdbf035", decimals: 8 },
  { symbol: "frxUSD", name: "Frax USD", faAddress: "0xe4354602aa4311f36240dd57f3f3435ffccdbd0cd2963f1a69da39a2dbcd59b5", decimals: 8 },
  { symbol: "sfrxUSD", name: "Staked Frax USD", faAddress: "0xbf2efbffbbd7083aaf006379d96b866b73bb4eb9684a7504c62feafe670962c2", decimals: 8 },
  { symbol: "MSD", name: "MSD", faAddress: "0x7c9d9f4972072b6ff7dfa48f259688e7286abac9ebd192bbda30fea910139024", decimals: 6 },
  { symbol: "LEAF", name: "Canopy LEAF", faAddress: "0x111ac0a7d030c38d03da162e2bb38bf5a10d398891d38b58fb14b5f5fb4ead08", decimals: 8 },
  { symbol: "GUI", name: "GUI", faAddress: "0xdcba5be90cd1fe5d549f9cc97eb9d24d4809b92aeaea9562e12510d91bd0f187", decimals: 6 },
  { symbol: "CAPY", name: "CAPY", faAddress: "0x967d9125a338c5b1e22b6aacaa8d14b2b8b785ca44b614803ecbcdb4898229f3", decimals: 8 },
  { symbol: "mBTC", name: "Movement BTC", faAddress: "0x0b7400b60e249c92b6b97717e29915474d90eec3e8c510bf5675628367d39e35", decimals: 10 },
  { symbol: "brBTC", name: "brBTC", faAddress: "0x5d613a51971832b7687322fbd60760ffe500a86acb73b7527d617b86381aa47f", decimals: 8 },
  { symbol: "OTC", name: "OTC", faAddress: "0x3ffd430a87712e1c31adf5f61bafb377eaef8139d1b61b24eef085d2bf40c831", decimals: 8 },
  { symbol: "savUSD", name: "savUSD", faAddress: "0xde6eb2598d91fd43c432ba7f0bca56158525a74ac0841b749ce17bf984cf5642", decimals: 8 },
  { symbol: "M-BTC", name: "M-BTC", faAddress: "0xc457331726b4672205f8a89f7b6e3a0545e2edadf6e4ee86ceaaf9147ae9d80a", decimals: 8 },
  { symbol: "mUSD", name: "Movement USD", faAddress: "0x5e15635e1c0f8d5b4e3f8c6e2c5bc6a7c8d2f1e9a4b3c7d6e8f0a1b2c3d4e5f6", decimals: 6 },
  { symbol: "stMOVE", name: "Staked MOVE", faAddress: "0x7e8c9a1b2d3f4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a", decimals: 8 },

  // Canopy vault tokens
  { symbol: "cvMOVE (0)", name: "Canopy Vault MOVE (0)", faAddress: "0xe005014fbdd053aebf97b9a36dfeed790d337f571fa9d37690f527acb3015e02", decimals: 8 },
  { symbol: "cvMOVE (2)", name: "Canopy Vault MOVE (2)", faAddress: "0x01d42fda1a3eac95ebcb4a35ba7f2c76c35855800c9fbf45a5255d146b5bac15", decimals: 8 },
  { symbol: "cvUSDC.e (3)", name: "Canopy Vault USDC.e (3)", faAddress: "0x679de9764607030c4f766793196c59a4035d11d41695ad383be7fd5ec96627e1", decimals: 6 },
  { symbol: "cvUSDT.e (4)", name: "Canopy Vault USDT.e (4)", faAddress: "0x260648cd9df892b69182cc341f07ea7354f844abbe19a9fadbbd95132d56be4e", decimals: 6 },
  { symbol: "cvWETH.e (5)", name: "Canopy Vault WETH.e (5)", faAddress: "0x7555729240b52bef2e6af44ea7b4283027de89d64153c8dddd15643a8b5a4f64", decimals: 8 },
  { symbol: "cvWBTC.e (6)", name: "Canopy Vault WBTC.e (6)", faAddress: "0xd5a87506bae06f7a76f6361749f782ba6843a0ef712849e90c0a4be8396f2023", decimals: 8 },
  { symbol: "cvUSDC.e (7)", name: "Canopy Vault USDC.e (7)", faAddress: "0x5da81e017aeed89d1a7b306a6c77eff6fd47b341fd9d6ec45af8136b46c04b80", decimals: 6 },
  { symbol: "cvUSDT.e (8)", name: "Canopy Vault USDT.e (8)", faAddress: "0x1ed1007f9ba7d576ec0120a87c886582d725c3c7eddae17ae4f86e0c0ca0dba0", decimals: 6 },
  { symbol: "cvWETH.e (9)", name: "Canopy Vault WETH.e (9)", faAddress: "0x07a5f035e9453d51c9d3b8678aeab50504fac181bc4caf72f5351411911b1530", decimals: 8 },
  { symbol: "cvWBTC.e (10)", name: "Canopy Vault WBTC.e (10)", faAddress: "0x60eddcf8672a9c9b9e61d422e511be66cbbbb9b9dfc0d3eb26c91e150a509472", decimals: 8 },
  { symbol: "cvMER-LP (31)", name: "Canopy Vault MER-LP (31)", faAddress: "0x14885b3fbcb8b5d12393315173307dc59adeba3ed209267dde94ebc12e771c04", decimals: 8 },
  { symbol: "cvrsETH (32)", name: "Canopy Vault rsETH (32)", faAddress: "0x095a1771f3c4569ca57c1e1a55e5b7f985028ba698e7f7b37bc3d582c1cfff6f", decimals: 8 },
  { symbol: "cvezETH (20)", name: "Canopy Vault ezETH (20)", faAddress: "0xa97e35be912b77b4c510f91c396d48217245dc9a910ec05bc37c68846ea624d3", decimals: 8 },
  { symbol: "cvLBTC (21)", name: "Canopy Vault LBTC (21)", faAddress: "0xa0b21251d70f83ab2c029852ccf5045a457a1ea823e057f7d1c2edf430318ce8", decimals: 8 },
  { symbol: "cvstBTC (25)", name: "Canopy Vault stBTC (25)", faAddress: "0x9238f77f226807647f0a7eb5f4a3347630d3c3a03eab45da84d38a9f13669325", decimals: 8 },
  { symbol: "cvrsETH (26)", name: "Canopy Vault rsETH (26)", faAddress: "0x5d127f7607a8c8509c1bc02512fb74c70c78ded3c702d21320304fc60320f6e9", decimals: 8 },
  { symbol: "cvSolvBTC (27)", name: "Canopy Vault SolvBTC (27)", faAddress: "0x044d42a3b738a8d9a30de1082bd9e461286da0692b53fac8f0be5852407bcc7f", decimals: 8 },
  { symbol: "cvsUSDa (46)", name: "Canopy Vault sUSDa (46)", faAddress: "0x12f98cf92689ba9ea6224d2d0d3d3b7879bd69759f397727edee33104888eed3", decimals: 8 },
  { symbol: "cvMOVE (15)", name: "Canopy Vault MOVE (15)", faAddress: "0x3d871f7475a839376b5567de59807db876203c628f71c75dbeefdb60139a10f8", decimals: 8 },
  { symbol: "cvMOVE (45)", name: "Canopy Vault MOVE (45)", faAddress: "0xb9b0b7d867e0f4735953d4c43976ec18322294fa1cb09ac893cce723a347aba1", decimals: 8 },

  // IPX LP tokens
  { symbol: "IPX s-USDCe/USDTe", name: "IPX Stable USDCe/USDTe LP", faAddress: "0x54c89a961dd60e30f1c03ba2c6f5a052e7ed0ba36fcca3c1153f06449199b285", decimals: 9 },
  { symbol: "IPX v-USDCe/MOVE", name: "IPX Volatile USDCe/MOVE LP", faAddress: "0x691877d4f5d4c1177d02f6ca3d399df4624af265533d305c008f6cb15d1567bc", decimals: 9 },
  { symbol: "IPX v-USDTe/MOVE", name: "IPX Volatile USDTe/MOVE LP", faAddress: "0x12061cb8e5a17ae7d34dd3371479f7cec323e4ad16b8991792fb496d739e87af", decimals: 9 },
  { symbol: "IPX v-USDCe/WETHe", name: "IPX Volatile USDCe/WETHe LP", faAddress: "0x110a99c29036cf12de428f55c6c1e1838578e3db6d17a0b3b4e6d2e101d124f1", decimals: 9 },
  { symbol: "IPX v-MOVE/WETHe", name: "IPX Volatile MOVE/WETHe LP", faAddress: "0xc047546436145affa73b73df880d7b3a3c793e7155e0c6ad00a323ffc7e1d65a", decimals: 9 },
  { symbol: "IPX s-mUSD/USDCe", name: "IPX Stable mUSD/USDCe LP", faAddress: "0x11a9500b4eaae0375dea274403bc9a508122c19139f586ba50aea6433e9ff70a", decimals: 9 },
  { symbol: "IPX s-wBTCe/mBTC", name: "IPX Stable wBTCe/mBTC LP", faAddress: "0x02e519bd6512e477af16ab99cddd26da6d7a75fed9d2a4bfa1fec6963e1a6a42", decimals: 9 },
];

export function findToken(query: string): TokenInfo | undefined {
  const q = query.toLowerCase().trim();
  return TOKEN_REGISTRY.find(
    (t) => t.symbol.toLowerCase() === q || t.name.toLowerCase() === q
  );
}

export function findTokenByAddress(address: string): TokenInfo | undefined {
  const addr = address.toLowerCase();
  return TOKEN_REGISTRY.find((t) => t.faAddress.toLowerCase() === addr);
}

export function formatTokenAmount(amount: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fractional = amount % divisor;
  if (fractional === 0n) return whole.toString();
  const fracStr = fractional.toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${whole}.${fracStr}`;
}

export function parseTokenAmount(amount: string, decimals: number): bigint {
  const parts = amount.split(".");
  const whole = BigInt(parts[0]) * BigInt(10 ** decimals);
  if (parts.length === 1) return whole;
  const fracStr = parts[1].slice(0, decimals).padEnd(decimals, "0");
  return whole + BigInt(fracStr);
}
