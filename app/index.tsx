import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSharedValue, withTiming, withRepeat, Easing } from "react-native-reanimated";
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
          {/* Animated sun with cloud and rain */}
          <View style={styles.weatherElement}>
            {/* Sun (gold circle) */}
            <View style={styles.sun}>
              {/* Sun smile */}
              <View style={styles.sunSmile} />
            </View>
            {/* Cloud (white shape) */}
            <View style={styles.cloud} />
            {/* Rain drops */}
            {Array.from({ length: 5 }, (_, i) => (
              <View
                key={i}
                style={styles.rainDrop}
              />
            ))}
          </View>

          {/* "Weather" and "ForeCasts" text */}
          <View style={styles.textContainer}>
            <Text style={styles.weatherTitle}>Weather</Text>
            <Text style={styles.forecastTitle}>ForeCasts</Text>
          </View>
        </View>

        {/* Gold "Get Started" button at bottom */}
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={() => router.push("/home")}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.MD,
  },

  gradientBackground: {
    flex: 1,
    backgroundColor: "#1B1840",
  },

  weatherContainer: {
    position: "absolute",
    top: SCREEN_HEIGHT * 0.15,
    width: SCREEN_WIDTH * 0.8,
    alignItems: "center",
  },

  weatherElement: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    // Make it square-ish for the weather icon
    borderRadius: BORDER_RADIUS.FULL,
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: SPACING.LG,
    backdropFilter: "blur(10px)",
    position: "relative",
  },

  sun: {
    width: SCREEN_WIDTH * 0.25,
    height: SCREEN_WIDTH * 0.25,
    borderRadius: BORDER_RADIUS.FULL,
    backgroundColor: COLORS.GOLD,
    marginBottom: SPACING.SM,
    position: "absolute",
    top: -SCREEN_WIDTH * 0.08, // Position above the container
  },

  sunSmile: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: BORDER_RADIUS.FULL,
    backgroundColor: "#1B1840",
    top: 8,
    left: 8,
  },

  cloud: {
    width: "100%",
    height: 60,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 30,
    marginTop: SPACING.SM,
    position: "relative",
  },

  rainDrop: {
    position: "absolute",
    width: 2,
    height: 15,
    backgroundColor: COLORS.GOLD,
    borderRadius: 2,
    opacity: 0.8,
    top: 30,
    left: "50%",
    marginLeft: -1,
  },

  textContainer: {
    marginTop: SPACING.LG,
    alignItems: "center",
  },

  weatherTitle: {
    ...FONT.BOLD,
    fontSize: 40,
    color: COLORS.WHITE,
    textAlign: "center",
    marginBottom: SPACING.XS,
  },

  forecastTitle: {
    ...FONT.BOLD,
    fontSize: 30,
    color: COLORS.GOLD,
    textAlign: "center",
  },

  getStartedButton: {
    position: "absolute",
    bottom: SCREEN_HEIGHT * 0.1,
    width: SCREEN_WIDTH * 0.6,
    backgroundColor: COLORS.GOLD,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  buttonText: {
    ...FONT.SEMIBOLD,
    fontSize: 18,
    color: COLORS.DEEP_NAVY,
    textTransform: "uppercase",
  },
});