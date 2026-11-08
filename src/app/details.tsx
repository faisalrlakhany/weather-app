import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getWeather, getAirQuality } from "../../services/weatherService";

export default function DetailsScreen() {
  const params = useLocalSearchParams<{
    lat: string;
    lon: string;
    city: string;
    country?: string;
  }>();
  const lat = params.lat ? Number(params.lat) : undefined;
  const lon = params.lon ? Number(params.lon) : undefined;
  const city = params.city ?? "London";
  const country = params.country;
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (lat == null || lon == null) {
      setError("Invalid location");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [weather, airQuality] = await Promise.all([
        getWeather(lat, lon),
        getAirQuality(lat, lon),
      ]);
      setWeatherData(weather);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load weather data");
    } finally {
      setLoading(false);
    }
  }, [lat, lon]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E6B325" />
        </View>
      );
    }
    if (error || !weatherData) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || "Something went wrong"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    const { todayMax, todayMin } = weatherData;
    const cityDisplay = country ? `${city}, ${country}` : city;
    return (
      <>
        <View style={styles.header}>
          <Text style={styles.cityName}>{cityDisplay}</Text>
          <Text style={styles.maxMin}>
            Max: {Math.round(todayMax)}°  Min: {Math.round(todayMin)}°
          </Text>
        </View>
        <View style={styles.middle}>
          {/* Empty space for upcoming prompts */}
        </View>
        <View style={styles.bottomWrap}>
          <TouchableOpacity
            style={[styles.bottomWrap, { paddingBottom: insets.bottom + 16 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="menu-outline" size={34} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <ExpoStatusBar style="light" />
      <LinearGradient
        colors={["#1B1840", "#2E2068", "#5A33A8", "#8E55C8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      >
        <View style={{ flex: 1, paddingTop: insets.top + 16 }}>
          {renderContent()}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B1840",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginBottom: 24,
    fontFamily: "Poppins_400Regular",
  },
  retryButton: {
    backgroundColor: "#E6B325",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    fontSize: 16,
    color: "#1B1840",
    fontFamily: "Poppins_600SemiBold",
  },
  header: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cityName: {
    fontSize: 18,
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
  },
  maxMin: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginTop: 4,
  },
  middle: {
    flex: 1,
  },
  bottomWrap: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
});
