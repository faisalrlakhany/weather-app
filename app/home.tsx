import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { FONT, COLORS, SPACING, BORDER_RADIUS, GLASS_STYLES } from "../constants/theme";
import {
  searchCity,
  getWeather,
  getAirQuality,
  mapWeatherCode,
  type WeatherData,
  type CityResult,
} from "../../services/weatherService";

// Default city
const DEFAULT_CITY = "London";

// Weather icon emoji mapping
const WEATHER_EMOJI: Record<string, string> = {
  sunny: "☀️",
  "partly-cloudy": "⛅",
  cloudy: "☁️",
  rain: "🌧️",
  thunderstorm: "⛈️",
  snow: "🌨️",
  fog: "🌫️",
};

// Small icon for hourly forecast
const HOURLY_EMOJI: Record<string, string> = {
  sunny: "☀️",
  "partly-cloudy": "⛅",
  cloudy: "☁️",
  rain: "🌧️",
  thunderstorm: "⛈️",
  snow: "🌨️",
  fog: "🌫️",
};

export default function HomeScreen() {
  const router = useRouter();
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [cityName, setCityName] = useState<string>(DEFAULT_CITY);
  const [country, setCountry] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cities = await searchCity(DEFAULT_CITY);
      if (cities.length === 0) {
        throw new Error("City not found");
      }

      const city = cities[0];
      setCityName(city.name);
      setCountry(city.country);

      const [weather, airQuality] = await Promise.all([
        getWeather(city.latitude, city.longitude),
        getAirQuality(city.latitude, city.longitude),
      ]);

      setWeatherData(weather);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load weather data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient
          colors={["#1B1840", "#3B2478", "#6B3FA0", "#A97BE0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E6B325" />
            <Text style={styles.loadingText}>Loading weather...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (error || !weatherData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient
          colors={["#1B1840", "#3B2478", "#6B3FA0", "#A97BE0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error || "Something went wrong"}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const { current, todayMax, todayMin, hourly } = weatherData;
  const currentIcon = WEATHER_EMOJI[current.iconName] || "🌤️";
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={["#1B1840", "#3B2478", "#6B3FA0", "#A97BE0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topSection}>
            <Text style={styles.locationText}>
              {cityName}, {country}
            </Text>
            <Text style={styles.maxMinText}>
              Max: {Math.round(todayMax)}° Min: {Math.round(todayMin)}°
            </Text>
          </View>

          <View style={styles.centerSection}>
            <Text style={styles.weatherIcon}>{currentIcon}</Text>
            <Text style={styles.temperature}>{Math.round(current.temperature)}°</Text>
            <Text style={styles.precipitationsLabel}>Precipitations</Text>
            <Text style={styles.maxMinDetail}>
              Max: {Math.round(todayMax)}° Min: {Math.round(todayMin)}°
            </Text>
          </View>

          <BlurView intensity={40} tint="light" style={styles.glassCard}>
            <View style={styles.glassCardContent}>
              <View style={styles.todayHeader}>
                <Text style={styles.todayTitle}>Today</Text>
                <Text style={styles.todayDate}>{dateStr}</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hourlyList}
              >
                {hourly.map((hour, index) => {
                  const hourTime = new Date(hour.time).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    hour12: true,
                  });
                  const hourIcon = HOURLY_EMOJI[current.iconName] || "🌤️";
                  return (
                    <View key={index} style={styles.hourlyItem}>
                      <Text style={styles.hourlyTime}>{hourTime}</Text>
                      <Text style={styles.hourlyIcon}>{hourIcon}</Text>
                      <Text style={styles.hourlyTemp}>{Math.round(hour.temperature)}°</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </BlurView>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B1840",
  },

  gradient: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Poppins_400Regular",
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },

  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
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

  topSection: {
    alignItems: "center",
    marginBottom: 20,
  },

  locationText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
  },

  maxMinText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginTop: 4,
  },

  centerSection: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginBottom: 20,
  },

  weatherIcon: {
    fontSize: 100,
    marginBottom: 8,
  },

  temperature: {
    fontSize: 72,
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
  },

  precipitationsLabel: {
    fontSize: 16,
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginTop: 8,
  },

  maxMinDetail: {
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    marginTop: 4,
  },

  glassCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  glassCardContent: {
    padding: 20,
  },

  todayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  todayTitle: {
    fontSize: 20,
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
  },

  todayDate: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Poppins_400Regular",
  },

  hourlyList: {
    flexDirection: "row",
    gap: 16,
  },

  hourlyItem: {
    alignItems: "center",
    minWidth: 60,
  },

  hourlyTime: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Poppins_400Regular",
    marginBottom: 8,
  },

  hourlyIcon: {
    fontSize: 24,
    marginBottom: 8,
  },

  hourlyTemp: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
  },
});