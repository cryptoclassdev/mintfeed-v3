const { withAndroidManifest } = require("expo/config-plugins");

/**
 * Expo config plugin that adds <queries> entries for each known wallet's
 * URI scheme. Required on Android 11+ (API 30) for Linking.canOpenURL()
 * to return accurate results.
 *
 * The MWA library already adds `solana-wallet://`, so we only add the
 * wallet-specific schemes here.
 */
const WALLET_SCHEMES = ["phantom", "solflare", "backpack", "ultimate"];

function addWalletQueries(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;

    if (!manifest.queries) {
      manifest.queries = [];
    }

    // Ensure queries array has an intent array
    const queries = manifest.queries;
    if (!Array.isArray(queries)) {
      return mod;
    }

    // Find or create the queries element
    let queriesObj = queries[0];
    if (!queriesObj) {
      queriesObj = {};
      queries.push(queriesObj);
    }

    if (!queriesObj.intent) {
      queriesObj.intent = [];
    }

    for (const scheme of WALLET_SCHEMES) {
      const alreadyExists = queriesObj.intent.some(
        (intent) =>
          intent.data &&
          intent.data.some(
            (d) => d.$?.["android:scheme"] === scheme,
          ),
      );

      if (!alreadyExists) {
        queriesObj.intent.push({
          action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
          category: [
            { $: { "android:name": "android.intent.category.BROWSABLE" } },
          ],
          data: [{ $: { "android:scheme": scheme } }],
        });
      }
    }

    return mod;
  });
}

module.exports = addWalletQueries;
