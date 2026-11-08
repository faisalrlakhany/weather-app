import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  StatusBar,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
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

// Map weather icon name (from mapWeatherCode) to the 3D PNG assets
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

const HOUSE_IMAGE = require("../../assets/images/house.png");

function getWeatherImageKey(iconName: string, isDay: boolean = true): string {
  if (!isDay && iconName === "sunny") return "night";
  return iconName;
}

export default function HomeScreen() {
  const router = useRouter();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const insets = useSafeAreaInsets();

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

  // Floating animation for hero weather image
  const floatAnim = useSharedValue(0);
  useEffect(() => {
    floatAnim.value = withRepeat(
      withTiming(-12, { duration: 1250, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }));

  // Fade-in + slide-up for cards on mount
  const cardAnim = useSharedValue(0);
  useEffect(() => {
    cardAnim.value = withDelay(
      200,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
    );
  }, []);
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardAnim.value,
    transform: [{ translateY: (1 - cardAnim.value) * 30 }],
  }));

  // Loading skeleton
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
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
      </View>
    );
  }

  // Error state
  if (error || !weatherData) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
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
      </View>
    );
  }

  const { current, todayMax, todayMin, hourly } = weatherData;
  const currentImageKey = getWeatherImageKey(current.iconName, current.isDay);
  const currentImage = WEATHER_IMAGES[currentImageKey] || WEATHER_IMAGES.cloudy;

  // Condition label: show "Precipitations" for precipitation-bearing conditions
  const conditionLabel =
    current.iconName === "rain" || current.iconName === "thunderstorm"
      ? "Precipitations"
      : current.weatherLabel;

  const maxMinStr = `Max: ${Math.round(todayMax)}° Min: ${Math.round(todayMin)}°`;

  const formattedDate = `${new Date().toLocaleDateString("en-US", { month: "short" })}, ${new Date().getDate()}`;

  const sunrise = weatherData.sunrise;
  const sunset = weatherData.sunset;

  const isNightHour = (timeStr: string): boolean => {
    const d = new Date(timeStr);
    const mins = d.getHours() * 60 + d.getMinutes();
    const sr = sunrise ? new Date(sunrise) : null;
    const ss = sunset ? new Date(sunset) : null;
    if (sr && ss) {
      const srMins = sr.getHours() * 60 + sr.getMinutes();
      const ssMins = ss.getHours() * 60 + ss.getMinutes();
      return mins < srMins || mins > ssMins;
    }
    return d.getHours() < 6 || d.getHours() >= 19;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#1B1840", "#3B2478", "#6B3FA0", "#A97BE0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 12, paddingBottom: 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.locationText}>
              {cityName}
            </Text>
          </View>

          {/* Hero */}
          <View style={styles.heroSection}>
            <Animated.View style={floatStyle}>
              <Image
                source={currentImage}
                style={{
                  width: SCREEN_WIDTH * 0.5,
                  height: SCREEN_WIDTH * 0.5,
                  aspectRatio: 1,
                }}
                resizeMode="contain"
              />
            </Animated.View>
            <Text style={styles.temperature}>{Math.round(current.temperature)}°</Text>
            <Text style={styles.conditionLabel}>{conditionLabel}</Text>
            <Text style={styles.maxMinDetail}>{maxMinStr}</Text>
          </View>

          {/* House illustration */}
          <Image
            source={HOUSE_IMAGE}
            style={{
              width: SCREEN_WIDTH * 0.6,
              height: SCREEN_WIDTH * 0.6 * 0.6,
              alignSelf: "center",
              marginBottom: -30,
            }}
            resizeMode="contain"
          />

          {/* Today glass card */}
          <Animated.View style={cardStyle}>
            <View style={styles.glassCard}>
              <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill} />
              <View style={styles.glassCardContent}>
                <View style={styles.todayHeader}>
                  <Text style={styles.todayTitle}>Today</Text>
                  <Text style={styles.todayDate}>{formattedDate}</Text>
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
                    const night = isNightHour(hour.time);
                    const hourIconName = getWeatherImageKey(current.iconName, !night);
                    const hourImage =
                      WEATHER_IMAGES[hourIconName] || WEATHER_IMAGES.cloudy;
                    return (
                      <React.Fragment key={index}>
                        <View style={styles.hourlyItem}>
                          <Text style={styles.hourlyTemp}>{Math.round(hour.temperature)}°</Text>
                          <Image
                            source={hourImage}
                            style={{ width: 40, height: 40, marginVertical: 8 }}
                            resizeMode="contain"
                          />
                          <Text style={styles.hourlyTime}>{hourTime}</Text>
                        </View>
                        {index < hourly.length - 1 && (
                          <View style={styles.divider} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
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

  headerSection: {
    alignItems: "center",
    marginBottom: 12,
  },

  locationText: {
    fontSize: 18,
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
  },

  maxMinText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginTop: 4,
  },

  heroSection: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  temperature: {
    fontSize: 64,
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    marginTop: -8,
  },

  conditionLabel: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    marginTop: 2,
  },

  maxMinDetail: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginTop: 2,
  },

  glassCard: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.14)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
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
    fontSize: 18,
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
  },

  todayDate: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Poppins_400Regular",
  },

  hourlyList: {
    flexDirection: "row",
    alignItems: "center",
  },

  hourlyItem: {
    alignItems: "center",
    minWidth: 60,
    paddingHorizontal: 8,
  },

  divider: {
    width: 1,
    height: 50,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginHorizontal: 4,
  },

  hourlyTime: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Poppins_400Regular",
    marginTop: 4,
  },

  hourlyTemp: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 4,
  },
});
