import { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fonts, fontSize } from "@/constants/typography";

type MidnightIntroProps = {
  visible: boolean;
  onFinish: () => void;
};

const INTRO_DURATION_MS = 1250;

export function MidnightIntro({ visible, onFinish }: MidnightIntroProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const tileProgress = useRef(new Animated.Value(0)).current;
  const wordmarkProgress = useRef(new Animated.Value(0)).current;
  const subtitleProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduceMotion) => {
        if (cancelled) return;

        const animation = reduceMotion
          ? Animated.timing(opacity, {
              toValue: 0,
              duration: 180,
              delay: 280,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            })
          : Animated.sequence([
              Animated.parallel([
                Animated.timing(tileProgress, {
                  toValue: 1,
                  duration: 420,
                  easing: Easing.out(Easing.cubic),
                  useNativeDriver: true,
                }),
                Animated.timing(wordmarkProgress, {
                  toValue: 1,
                  duration: 440,
                  delay: 120,
                  easing: Easing.out(Easing.cubic),
                  useNativeDriver: true,
                }),
                Animated.timing(subtitleProgress, {
                  toValue: 1,
                  duration: 460,
                  delay: 230,
                  easing: Easing.out(Easing.cubic),
                  useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                  toValue: 1,
                  duration: 1,
                  useNativeDriver: true,
                }),
              ]),
              Animated.delay(Math.max(INTRO_DURATION_MS - 840, 0)),
              Animated.timing(opacity, {
                toValue: 0,
                  duration: 220,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
            ]);

        animation.start(({ finished }) => {
          if (finished && !cancelled) onFinish();
        });
      });

    return () => {
      cancelled = true;
      opacity.stopAnimation();
      tileProgress.stopAnimation();
      wordmarkProgress.stopAnimation();
      subtitleProgress.stopAnimation();
    };
  }, [onFinish, opacity, subtitleProgress, tileProgress, visible, wordmarkProgress]);

  if (!visible) return null;

  const tileOpacity = tileProgress.interpolate({
    inputRange: [0, 0.22, 1],
    outputRange: [0, 0.9, 1],
  });
  const tileTranslateY = tileProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });
  const tileScale = tileProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });

  const wordmarkOpacity = wordmarkProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const wordmarkTranslateY = wordmarkProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });
  const subtitleOpacity = subtitleProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const subtitleTranslateY = subtitleProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.overlay, { opacity }]}
    >
      <Animated.View
        style={[
          styles.tileWrap,
          {
            opacity: tileOpacity,
            transform: [{ translateY: tileTranslateY }, { scale: tileScale }],
          },
        ]}
      >
        <Image
          accessibilityIgnoresInvertColors
          source={require("@/assets/splash-tile.png")}
          style={styles.tile}
        />
      </Animated.View>
      <Animated.Text
        style={[
          styles.wordmark,
          {
            opacity: wordmarkOpacity,
            transform: [{ translateY: wordmarkTranslateY }],
          },
        ]}
      >
        midnight
      </Animated.Text>
      <Animated.View
        style={[
          styles.subtitleWrap,
          {
            opacity: subtitleOpacity,
            transform: [{ translateY: subtitleTranslateY }],
          },
        ]}
      >
        <Text style={styles.subtitle}>Crypto & AI news.</Text>
        <Text style={styles.subtitle}>Swipe to explore.</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "#030303",
    justifyContent: "center",
    zIndex: 1000,
  },
  tile: {
    height: 132,
    resizeMode: "contain",
    width: 132,
  },
  tileWrap: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
  },
  wordmark: {
    color: "#f2f2f2",
    fontFamily: fonts.brand.regular,
    fontSize: 30,
    letterSpacing: -0.6,
    marginTop: 26,
  },
  subtitleWrap: {
    alignItems: "center",
    marginTop: 28,
  },
  subtitle: {
    color: "#c9c9c9",
    fontFamily: fonts.body.regular,
    fontSize: fontSize.lg,
    lineHeight: 24,
  },
});
