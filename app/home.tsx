import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FONT, COLORS } from "../constants/theme";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#6B3FA0", "#A97BE0", "#1B1840"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Weather Dashboard</Text>
          <Text style={styles.subtitle}>
            Welcome to your weather application
          </Text>
          {/* Add weather content here */}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    ...FONT.BOLD,
    fontSize: 32,
    color: COLORS.WHITE,
    textAlign: "center",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.MUTED_WHITE,
    textAlign: "center",
    marginBottom: 40,
  },
});