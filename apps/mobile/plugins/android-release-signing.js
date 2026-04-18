const { withAppBuildGradle } = require("expo/config-plugins");

/**
 * Adds a `release` signingConfigs entry to android/app/build.gradle and wires
 * the release buildType to use it. Values are read from env vars at Gradle time:
 *
 *   ANDROID_KEYSTORE_PASSWORD — storePassword
 *   ANDROID_KEY_ALIAS         — keyAlias
 *   ANDROID_KEY_PASSWORD      — keyPassword
 *
 * Keystore file is expected at android/app/release.keystore (decoded from the
 * ANDROID_KEYSTORE_BASE64 GitHub secret by the CI workflow before assembleRelease).
 */
function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;

    if (gradle.includes("signingConfigs.release ")) return cfg;

    const releaseSigning = `
        release {
            storeFile file('release.keystore')
            storePassword System.getenv('ANDROID_KEYSTORE_PASSWORD') ?: ''
            keyAlias System.getenv('ANDROID_KEY_ALIAS') ?: ''
            keyPassword System.getenv('ANDROID_KEY_PASSWORD') ?: ''
        }`;

    gradle = gradle.replace(
      /(signingConfigs\s*\{\s*debug\s*\{[^}]+\})\s*\}/,
      `$1${releaseSigning}\n    }`,
    );

    gradle = gradle.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/,
      "$1signingConfig signingConfigs.release",
    );

    cfg.modResults.contents = gradle;
    return cfg;
  });
}

module.exports = withAndroidReleaseSigning;
