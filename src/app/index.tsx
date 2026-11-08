import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSharedValue, withRepeat, withTiming, Easing } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { FONT, COLORS, SPACING, BORDER_RADIUS } from "../constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();

  // Reanimated shared value for floating animation
  const floatAnim = useSharedValue(0);

  // Start animation when component mounts
  React.useEffect(() => {
    floatAnim.value = withRepeat(
      withTiming(20, { duration: 2000, easing: Easing.out(Easing.cubic) }),
      -1,
    );
  }, []);

  // Button press animation
  const buttonScale = useSharedValue(1);

  const handlePressIn = () => {
    buttonScale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    buttonScale.value = withTiming(1, { duration: 100 });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Full-screen gradient background */}
      <LinearGradient
        colors={["#1B1840", "#6B3FA0", "#A97BE0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBackground}
      >
        {/* Floating weather animation in upper half */}
        <View style={styles.weatherContainer}>
          {/* Animated sun/cloud/rain element */}
          <View
            style={[
              styles.weatherElement,
              {
                transform: [
                  {
                    translateY: floatAnim.value,
                  },
                ],
              },
            ]}
          >
            {/* Sun (gold circle) */}
            <View style={styles.sun} />
            {/* Cloud (white shape) */}
            <View style={styles.cloud} />
            {/* Rain drops */}
            {Array.from({ length: 6 }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.rainDrop,
                  {
                    left: `${15 + i * 12}%`,
                    top: `${60 + (i % 3) * 10}%`,
                  },
                ]}
              />
            ))}
          </View>

          {/* "Weather" and "ForeCasts" text */}
          <View style={styles.textContainer}>
            <Text style={styles.weatherTitle}>Weather</Text>
            <Text style={styles.forecastTitle}>ForeCasts</Text>
          </View>
        </View>

        {/* Gold "Get Start" button at bottom */}
        <TouchableOpacity
          style={[
            styles.getStartedButton,
            {
              transform: [{ scale: buttonScale.value }],
            },
          ]}
          onPress={() => router.push("/home")}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Get Start</Text>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B1840",
  },

  gradientBackground: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },

  weatherContainer: {
    position: "absolute",
    top: SCREEN_HEIGHT * 0.12,
    width: SCREEN_WIDTH * 0.85,
    left: SCREEN_WIDTH * 0.075,
    alignItems: "center",
  },

  weatherElement: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    borderRadius: BORDER_RADIUS.FULL,
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: SPACING.LG,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },

  sun: {
    width: SCREEN_WIDTH * 0.22,
    height: SCREEN_WIDTH * 0.22,
    borderRadius: BORDER_RADIUS.FULL,
    backgroundColor: COLORS.GOLD,
    position: "absolute",
    top: -SCREEN_WIDTH * 0.05,
    left: SCREEN_WIDTH * 0.19,
  },

  cloud: {
    width: SCREEN_WIDTH * 0.35,
    height: SCREEN_WIDTH * 0.18,
    backgroundColor: "rgba(255,255,255,0.35)",
    borderRadius: SCREEN_WIDTH * 0.09,
    marginTop: SCREEN_WIDTH * 0.05,
  },

  rainDrop: {
    position: "absolute",
    width: 3,
    height: 16,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 2,
    opacity: 0.9,
  },

  textContainer: {
    marginTop: SPACING.XL,
    alignItems: "center",
  },

  weatherTitle: {
    fontFamily: FONT.BOLD,
    fontSize: 40,
    color: COLORS.WHITE,
    textAlign: "center",
    marginBottom: SPACING.XS,
  },

  forecastTitle: {
    fontFamily: FONT.BOLD,
    fontSize: 40,
    color: COLORS.GOLD,
    textAlign: "center",
  },

  getStartedButton: {
    position: "absolute",
    bottom: SCREEN_HEIGHT * 0.12,
    width: SCREEN_WIDTH * 0.6,
    left: SCREEN_WIDTH * 0.2,
    backgroundColor: COLORS.GOLD,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.FULL,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  buttonText: {
    fontFamily: FONT.SEMIBOLD,
    fontSize: 18,
    color: COLORS.DEEP_NAVY,
    textTransform: "uppercase",
  },
});