package com.mintfeed.app
import expo.modules.splashscreen.SplashScreenManager

import android.content.Intent
import android.os.Build
import android.os.Bundle

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {

  companion object {
    /** Set by WalletTargetModule from JS before calling MWA connect(). */
    @JvmStatic
    @Volatile
    var targetWalletPackage: String? = null
  }

  /**
   * Intercept MWA's startActivityForResult call.
   *
   * - When a target package is set: route the solana-wallet:// intent
   *   directly to that wallet app via intent.setPackage().
   * - When no target is set (Seeker / default MWA): wrap the intent
   *   with createChooser() so Android shows the wallet picker instead
   *   of silently routing to the default handler.
   */
  override fun startActivityForResult(intent: Intent, requestCode: Int) {
    val isMwaIntent = intent.action == Intent.ACTION_VIEW &&
        intent.data?.scheme == "solana-wallet"

    if (isMwaIntent) {
      val target = targetWalletPackage
      targetWalletPackage = null

      if (target != null) {
        intent.setPackage(target)
        super.startActivityForResult(intent, requestCode)
      } else {
        val chooser = Intent.createChooser(intent, "Choose wallet")
        super.startActivityForResult(chooser, requestCode)
      }
      return
    }

    super.startActivityForResult(intent, requestCode)
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    // setTheme(R.style.AppTheme);
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen
    super.onCreate(null)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}
