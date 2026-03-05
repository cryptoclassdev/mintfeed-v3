const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...(config.watchFolders || []), monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Fix broken ESM package exports that crash Metro on RN 0.83+
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = [
  "react-native",
  "browser",
  "require",
];

// MWA packages list "browser" before "react-native" in their exports map,
// so Metro picks the browser build (which requires HTTPS / window.isSecureContext).
// Force them to resolve to their native entry points instead.
const MWA_NATIVE_OVERRIDES = {
  "@solana-mobile/mobile-wallet-adapter-protocol":
    "@solana-mobile/mobile-wallet-adapter-protocol/lib/cjs/index.native.js",
  "@solana-mobile/mobile-wallet-adapter-protocol-web3js":
    "@solana-mobile/mobile-wallet-adapter-protocol-web3js/lib/cjs/index.native.js",
};

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Only override MWA resolution on Android — the native TurboModule doesn't exist on iOS
  if (platform === "android" && MWA_NATIVE_OVERRIDES[moduleName]) {
    return context.resolveRequest(
      context,
      MWA_NATIVE_OVERRIDES[moduleName],
      platform,
    );
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
