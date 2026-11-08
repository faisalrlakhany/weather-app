import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import type { ScrollViewInstance } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getWeather, getAirQuality } from "../../services/weatherService";

// Map weather icon name to the 3D PNG assets (same assets Home uses)
const WEATHER_IMAGES: Record<string, any> = {
  sunny: require("../../assets/images/sunny.png"),
  "partly-cloudy": require("../../assets/images/partly-cloudy.png"),
  cloudy: require("../../assets/images/cloudy.png"),
  rain: require("../../assets/images/rain.png"),
  thunderstorm: require("../../assets/images/thunder.png"),
  thunder: require("../../assets/images/thunder.png"),
  snow: require("../../assets/images/snow.png"),
  fog: require("../../assets/images/fog.png"),
  night: require("../../assets/images/night.png"),
};

const WEEK_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const forecastScrollRef = useRef<ScrollViewInstance | null>(null);
  const forecastScrollX = useRef(0);
  const PILL_STEP = 72; // pill width 62 + marginRight 10

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
        <Text style={styles.sectionTitle}>7-Days Forecasts</Text>
        <View style={styles.forecastRow}>
          <TouchableOpacity
            onPress={() => {
              const next = Math.max(0, forecastScrollX.current - PILL_STEP * 3);
              forecastScrollRef.current?.scrollTo({ x: next, animated: true });
            }}
          >
            <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <ScrollView
            ref={forecastScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              forecastScrollX.current = e.nativeEvent.contentOffset.x;
            }}
            scrollEventThrottle={16}
            contentContainerStyle={styles.pillsRow}
          >
            {weatherData.daily.map((day: any, index: number) => {
              const dayDate = new Date(
                parseInt(day.date.slice(0, 4), 10),
                parseInt(day.date.slice(5, 7), 10) - 1,
                parseInt(day.date.slice(8, 10), 10)
              );
              const dayName = WEEK_DAY_NAMES[dayDate.getDay()];
              const isSelected = index === selectedDayIndex;
              const pillImage = WEATHER_IMAGES[day.iconName] || WEATHER_IMAGES.cloudy;
              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.8}
                  onPress={() => setSelectedDayIndex(index)}
                >
                  <View
                    style={[
                      styles.pill,
                      isSelected ? styles.pillSelected : styles.pillUnselected,
                    ]}
                  >
                    <LinearGradient
                      colors={
                        isSelected
                          ? ["#B07CF0", "#7A4BC0"]
                          : ["rgba(255,255,255,0.20)", "rgba(255,255,255,0.08)"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.pillTemp}>{Math.round(day.tempMax)}°C</Text>
                    <Image
                      source={pillImage}
                      style={{ width: 36, height: 36 }}
                      resizeMode="contain"
                    />
                    <Text style={styles.pillDay}>{dayName}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            onPress={() => {
              const next = forecastScrollX.current + PILL_STEP * 3;
              forecastScrollRef.current?.scrollTo({ x: next, animated: true });
            }}
          >
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
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
  sectionTitle: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    marginTop: 24,
    marginHorizontal: 20,
  },
  forecastRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  pillsRow: {
    paddingHorizontal: 12,
  },
  pill: {
    width: 62,
    height: 120,
    borderRadius: 31,
    overflow: "hidden",
    marginRight: 10,
    alignItems: "center",
    justifyContent: "space-evenly",
    borderWidth: 1,
    borderColor: "transparent",
  },
  pillUnselected: {
    borderColor: "rgba(255,255,255,0.2)",
  },
  pillSelected: {
    borderColor: "transparent",
  },
  pillTemp: {
    fontSize: 13,
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
  },
  pillDay: {
    fontSize: 13,
    color: "#FFFFFF",
    fontFamily: "Poppins_400Regular",
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
