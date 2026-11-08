import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useRouter } from "expo-router";

// Keep splash screen visible until fonts are loaded
SplashScreen.preventAutoHideAsync();

export default function WelcomeScreen() {
  const router = useRouter();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Load Poppins fonts
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Hide splash screen once fonts are loaded
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Floating animation: translateY -12 to 12, 2.5s loop, easing in-out
  const floatAnim = useSharedValue(0);

  useEffect(() => {
    if (fontsLoaded) {
      floatAnim.value = withRepeat(
        withTiming(12, {
          duration: 1250,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    }
  }, [fontsLoaded]);

  const floatStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: floatAnim.value }],
    };
  });

  // Fade-in animation for text and button
  const fadeAnim = useSharedValue(0);

  useEffect(() => {
    if (fontsLoaded) {
      fadeAnim.value = withDelay(
        300,
        withTiming(1, {
          duration: 800,
          easing: Easing.out(Easing.cubic),
        })
      );
    }
  }, [fontsLoaded]);

  const fadeStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
    };
  });

  // Button press animation
  const buttonScale = useSharedValue(1);

  const handlePressIn = () => {
    buttonScale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    buttonScale.value = withTiming(1, { duration: 100 });
  };

  const buttonScaleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  // Don't render until fonts are loaded
  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar
        barStyle="light-content"
        translucent={true}
        backgroundColor="transparent"
      />

      {/* Full-screen gradient background */}
      <LinearGradient
        colors={["#1B1840", "#3B2478", "#6B3FA0", "#A97BE0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBackground}
      >
        {/* Top section: hero image */}
        <View style={styles.topSection}>
          <Animated.View style={floatStyle}>
            <Image
              source={require("../../assets/images/weather-hero.png")}
              style={{
                width: SCREEN_WIDTH * 0.8,
                aspectRatio: 1,
              }}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* Middle section: text */}
        <Animated.View style={[styles.middleSection, fadeStyle]}>
          <Text style={styles.weatherText}>Weather</Text>
          <Text style={styles.forecastText}>ForeCasts</Text>
        </Animated.View>

        {/* Bottom section: button */}
        <Animated.View
          style={[
            styles.bottomSection,
            fadeStyle,
            buttonScaleStyle,
            { marginBottom: 50 + insets.bottom },
          ]}
        >
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={() => router.push("/home")}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>Get Start</Text>
          </TouchableOpacity>
        </Animated.View>
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
    width: "100%",
    height: "100%",
  },

  topSection: {
    flex: 1.3,
    justifyContent: "center",
    alignItems: "center",
  },

  middleSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  weatherText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 44,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 52,
  },

  forecastText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 44,
    color: "#E6B325",
    textAlign: "center",
    lineHeight: 52,
  },

  bottomSection: {
    alignItems: "center",
  },

  getStartedButton: {
    width: "60%",
    height: 56,
    backgroundColor: "#E6B325",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#E6B325",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },

  buttonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#1B1840",
    textAlign: "center",
  },
});