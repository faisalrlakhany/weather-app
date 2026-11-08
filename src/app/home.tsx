import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
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

  // Subtle fade-in for the house illustration
  const houseAnim = useSharedValue(0);
  useEffect(() => {
    houseAnim.value = withDelay(
      350,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })
    );
  }, []);
  const houseStyle = useAnimatedStyle(() => ({
    opacity: houseAnim.value,
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

  const maxMinStr = `Max: ${Math.round(todayMax)}°  Min: ${Math.round(todayMin)}°`;

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
        <View
          style={[
            styles.content,
            { paddingTop: insets.top + 8 },
          ]}
        >
          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.locationText}>
              {cityName}
            </Text>
          </View>

          {/* Hero */}
          <View style={styles.heroSection}>
            <Animated.View style={[floatStyle, { marginTop: 16 }]}>
              <Image
                source={currentImage}
                style={{
                  width: SCREEN_WIDTH * 0.42,
                  height: SCREEN_WIDTH * 0.42,
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
          <View style={styles.houseSection}>
            <Animated.View style={houseStyle}>
              <Image
                source={HOUSE_IMAGE}
                style={{
                  width: "90%",
                  aspectRatio: 1.15,
                  alignSelf: "center",
                  marginBottom: -20,
                  zIndex: 2,
                }}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {/* Today card */}
          <Animated.View style={[styles.todayCardWrap, cardStyle, { marginBottom: 70 + insets.bottom }]}>
            <LinearGradient
              colors={["#3A2A8C", "#4B2F9E", "#6A3FB0"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.glassCard}
            >
              <View style={styles.glassCardContent}>
                <View style={styles.todayHeader}>
                  <Text style={styles.todayTitle}>Today</Text>
                  <Text style={styles.todayDate}>{formattedDate}</Text>
                </View>

                <View style={styles.hourlyList}>
                  {(() => {
                    const nowHour = new Date().getHours();
                    let startIdx = hourly.findIndex(
                      (h) => new Date(h.time).getHours() >= nowHour
                    );
                    if (startIdx < 0) startIdx = 0;
                    return hourly.slice(startIdx, startIdx + 4);
                  })().map((hour, index) => {
                    const d = new Date(hour.time);
                    const hh = String(d.getHours()).padStart(2, "0");
                    const mm = String(d.getMinutes()).padStart(2, "0");
                    const hourTime = `${hh}.${mm}`;
                    const night = isNightHour(hour.time);
                    const hourIconName = getWeatherImageKey(current.iconName, !night);
                    const hourImage =
                      WEATHER_IMAGES[hourIconName] || WEATHER_IMAGES.cloudy;
                    return (
                      <React.Fragment key={index}>
                        <View style={styles.hourlyItem}>
                          <Text style={styles.hourlyTemp}>{Math.round(hour.temperature)}°C</Text>
                          <Image
                            source={hourImage}
                            style={{ width: 40, height: 40, marginVertical: 8 }}
                            resizeMode="contain"
                          />
                          <Text style={styles.hourlyTime}>{hourTime}</Text>
                        </View>
                        {index < 3 && <View style={styles.divider} />}
                      </React.Fragment>
                    );
                  })}
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Bottom bar */}
        <LinearGradient
          colors={["#5A33A8", "#7A44B8"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.bottomBar, { height: 70 + insets.bottom }]}
        >
          <View style={styles.bottomBarIcons}>
            <View style={styles.bottomBarIcon} />
            <View style={styles.bottomBarIcon} />
            <View style={styles.bottomBarIcon} />
          </View>
        </LinearGradient>
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

  content: {
    flex: 1,
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
  },

  locationText: {
    fontSize: 18,
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
  },

  heroSection: {
    flex: 1.2,
    alignItems: "center",
    justifyContent: "center",
  },

  temperature: {
    fontSize: 60,
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    marginTop: -6,
  },

  conditionLabel: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    marginTop: 0,
  },

  maxMinDetail: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginTop: 2,
  },

  houseSection: {
    flex: 1.6,
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "visible",
  },

  todayCardWrap: {
    marginHorizontal: 0,
    zIndex: 1,
  },

  glassCard: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },

  glassCardContent: {
    padding: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
  },

  todayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 8,
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
    justifyContent: "space-around",
    backgroundColor: "rgba(20,10,60,0.30)",
    paddingVertical: 16,
    borderWidth: 0,
  },

  hourlyItem: {
    alignItems: "center",
    flex: 1,
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
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 4,
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: 40,
  },

  bottomBarIcons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  bottomBarIcon: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },
});
