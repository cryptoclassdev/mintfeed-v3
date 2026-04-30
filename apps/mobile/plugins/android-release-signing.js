const { withAppBuildGradle } = require("expo/config-plugins");

/**
 * Expo prebuild defaults release builds to the debug keystore unless we wire
 * release signing ourselves. Keep this in a config plugin so clean prebuilds in
 * CI always produce dApp Store-ready APKs signed by android/app/release.keystore.
 */
function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;

    if (!gradle.includes("release.keystore")) {
      gradle = gradle.replace(
        /(signingConfigs \{\n\s*debug \{[\s\S]*?\n\s*\})/,
        `$1
        release {
            storeFile file('release.keystore')
            storePassword((System.getenv('ANDROID_KEYSTORE_PASSWORD') ?: '').trim())
            keyAlias((System.getenv('ANDROID_KEY_ALIAS') ?: '').trim())
            keyPassword((System.getenv('ANDROID_KEY_PASSWORD') ?: '').trim())
        }`,
      );
    }

    gradle = gradle.replace(
      /(buildTypes \{[\s\S]*?release \{[\s\S]*?)signingConfig signingConfigs\.debug/,
      "$1signingConfig signingConfigs.release",
    );

    cfg.modResults.contents = gradle;
    return cfg;
  });
}

module.exports = withAndroidReleaseSigning;
