import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>SOMETHING WENT WRONG</Text>
        <Text style={styles.message}>
          {this.state.error?.message ?? "An unexpected error occurred"}
        </Text>
        <Pressable
          onPress={this.handleRestart}
          style={styles.button}
          accessibilityRole="button"
          accessibilityLabel="Restart the app"
        >
          <Text style={styles.buttonText}>RESTART</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#030303",
    padding: 32,
    gap: 16,
  },
  title: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.base,
    color: "#f0f0f0",
    letterSpacing: letterSpacing.wider,
  },
  message: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },
  button: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4C8BD0",
    minHeight: 48,
    justifyContent: "center",
  },
  buttonText: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.xs,
    color: "#4C8BD0",
    letterSpacing: letterSpacing.wider,
  },
});
