import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLoginWithEmail, useLoginWithOAuth } from "@privy-io/expo";
import { colors } from "@/constants/theme";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";
import { useAppStore } from "@/lib/store";

interface LoginScreenProps {
  onConnectWallet: () => void;
}

export default function LoginScreen({ onConnectWallet }: LoginScreenProps) {
  const theme = useAppStore((s) => s.theme);
  const themeColors = colors[theme];

  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [awaitingOtp, setAwaitingOtp] = useState(false);

  const { sendCode, loginWithCode, state: emailState } = useLoginWithEmail();
  const { login: loginWithGoogle, state: googleState } = useLoginWithOAuth();

  const isLoading =
    emailState.status === "sending-code" ||
    emailState.status === "submitting-code" ||
    googleState.status === "loading";

  async function handleSendCode() {
    if (!email.trim()) return;
    await sendCode({ email: email.trim() });
    setAwaitingOtp(true);
  }

  async function handleVerifyOtp() {
    if (!otpCode.trim()) return;
    await loginWithCode({ code: otpCode.trim() });
  }

  async function handleGoogleLogin() {
    await loginWithGoogle({ provider: "google" });
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: themeColors.text }]}>
        Sign In
      </Text>
      <Text style={[styles.subheading, { color: themeColors.textMuted }]}>
        Connect your account to unlock wallet features
      </Text>

      {!awaitingOtp ? (
        <View style={styles.form}>
          <TextInput
            style={[
              styles.input,
              {
                color: themeColors.text,
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              },
            ]}
            placeholder="Email address"
            placeholderTextColor={themeColors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
          />
          <Pressable
            style={[styles.button, { backgroundColor: themeColors.accent }]}
            onPress={handleSendCode}
            disabled={isLoading || !email.trim()}

          >
            {emailState.status === "sending-code" ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Continue with Email</Text>
            )}
          </Pressable>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={[styles.otpLabel, { color: themeColors.textSecondary }]}>
            Enter the code sent to {email}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                color: themeColors.text,
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              },
            ]}
            placeholder="Verification code"
            placeholderTextColor={themeColors.textMuted}
            keyboardType="number-pad"
            value={otpCode}
            onChangeText={setOtpCode}
            editable={!isLoading}
          />
          <Pressable
            style={[styles.button, { backgroundColor: themeColors.accent }]}
            onPress={handleVerifyOtp}
            disabled={isLoading || !otpCode.trim()}

          >
            {emailState.status === "submitting-code" ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </Pressable>
          <Pressable
            onPress={() => {
              setAwaitingOtp(false);
              setOtpCode("");
            }}
          >
            <Text style={[styles.backLink, { color: themeColors.textMuted }]}>
              Use a different email
            </Text>
          </Pressable>
        </View>
      )}

      <View style={styles.divider}>
        <View
          style={[styles.dividerLine, { backgroundColor: themeColors.border }]}
        />
        <Text style={[styles.dividerText, { color: themeColors.textMuted }]}>
          OR
        </Text>
        <View
          style={[styles.dividerLine, { backgroundColor: themeColors.border }]}
        />
      </View>

      <Pressable
        style={[
          styles.socialButton,
          {
            backgroundColor: themeColors.card,
            borderColor: themeColors.border,
          },
        ]}
        onPress={handleGoogleLogin}
        disabled={isLoading}

      >
        <Text style={[styles.socialButtonText, { color: themeColors.text }]}>
          Continue with Google
        </Text>
      </Pressable>

      <Pressable
        style={[
          styles.socialButton,
          {
            backgroundColor: themeColors.card,
            borderColor: themeColors.border,
          },
        ]}
        onPress={onConnectWallet}
        disabled={isLoading}

      >
        <Text style={[styles.socialButtonText, { color: themeColors.text }]}>
          Connect Wallet
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heading: {
    fontFamily: fonts.display.regular,
    fontSize: fontSize.xxl,
    marginBottom: 4,
  },
  subheading: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.base,
    marginBottom: 24,
  },
  form: {
    gap: 12,
  },
  input: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.base,
    padding: 14,
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 0.5,
  },
  button: {
    padding: 14,
    borderRadius: 12,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  buttonText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.base,
    color: "#FFFFFF",
  },
  otpLabel: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
  },
  backLink: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingVertical: 4,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
  },
  dividerText: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.xxs,
    letterSpacing: letterSpacing.wider,
    marginHorizontal: 12,
  },
  socialButton: {
    padding: 14,
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    minHeight: 48,
  },
  socialButtonText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.base,
  },
});
