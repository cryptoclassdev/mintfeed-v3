import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  // Bundle workspace packages so no raw .ts imports at runtime
  noExternal: ["@mintfeed/db", "@mintfeed/shared", "@onsol/tldparser"],
  // @onsol/tldparser transitively depends on @metaplex-foundation/beet-solana
  // which uses CJS require("@solana/web3.js"). Without this shim, ESM output
  // throws "Dynamic require of @solana/web3.js is not supported".
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
  // Prisma uses dynamic require("fs") — must stay external
  external: ["@prisma/client", ".prisma/client"],
});
