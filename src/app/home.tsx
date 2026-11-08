import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import * as NavigationBar from "expo-navigation-bar";
import { useRouter } from "expo-router";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getAirQuality,
  getWeather,
  searchCity,
  type WeatherData
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
  const [lat, setLat] = useState<number>(51.5074);
  const [lon, setLon] = useState<number>(-0.1278);
  const [locating, setLocating] = useState(false);

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
      setLat(city.latitude);
      setLon(city.longitude);

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

  // Android navigation bar: match the gradient bottom color, no white strip
  useEffect(() => {
    NavigationBar.setStyle("light");
  }, []);

  // On app open: silently request location and fetch the device's weather,
  // falling back to the default city (London) if permission/GPS unavailable.
  const fetchInitialLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const enabled = await Location.hasServicesEnabledAsync();
        if (enabled) {
          try {
            // Never hang forever: 10s timeout on the GPS fix
            const pos = await Promise.race([
              Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              }),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("location timeout")), 10000)
              ),
            ]);
            const { latitude, longitude } = pos.coords;
            const [weather, airQuality] = await Promise.all([
              getWeather(latitude, longitude),
              getAirQuality(latitude, longitude),
            ]);
            setWeatherData(weather);
            setLat(latitude);
            setLon(longitude);
            try {
              const places = await Location.reverseGeocodeAsync({
                latitude,
                longitude,
              });
              const p = places[0];
              setCityName(
                p?.city || p?.subregion || p?.region || "Current location"
              );
              setCountry(p?.country || "");
            } catch {
              // reverse geocode is best-effort only
            }
            return;
          } catch {
            // GPS timed out or failed -> fall back to the default city below
          } finally {
            setLoading(false);
          }
        }
      }
    } catch {
      // fall back to the default city below
    }
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchInitialLocation();
  }, [fetchInitialLocation]);

  const handleCurrentLocation = useCallback(async () => {
    setLocating(true);
    setError(null);
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLoading(false);
        setLocating(false);
        Alert.alert(
          "Location permission needed",
          "Please allow location permission to see your local weather."
        );
        return;
      }
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setLoading(false);
        setLocating(false);
        Alert.alert(
          "Location is off",
          "Please turn on GPS / location services on your phone."
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      const [weather, airQuality] = await Promise.all([
        getWeather(latitude, longitude),
        getAirQuality(latitude, longitude),
      ]);
      setWeatherData(weather);
      setLat(latitude);
      setLon(longitude);
      const places = await Location.reverseGeocodeAsync({ latitude, longitude });
      const p = places[0];
      setCityName(p?.city || p?.subregion || p?.region || "Current location");
      setCountry(p?.country || "");
    } catch (err) {
      setError("Could not get your location. Please try again.");
    } finally {
      setLoading(false);
      setLocating(false);
    }
  }, []);

  // Floating animation for hero weather image
  const floatAnim = useSharedValue(0);
  useEffect(() => {
    floatAnim.value = withRepeat(
      withTiming(-5, { duration: 1250, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
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

  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentDateParts = current.time ? current.time.split("T")[0].split("-") : [];
  const currentMonthIndex = currentDateParts.length > 1 ? parseInt(currentDateParts[1], 10) : 0;
  const currentDay = currentDateParts.length > 2 ? parseInt(currentDateParts[2], 10) : new Date().getDate();
  const formattedDate = `${MONTH_NAMES[currentMonthIndex - 1]}, ${currentDay}`;

  const sunrise = weatherData.sunrise;
  const sunset = weatherData.sunset;

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
          {/* Hero: icon + temperature + condition + Max/Min */}
          <View style={styles.heroSection}>
          <Animated.View style={[floatStyle, { marginBottom: -10 }]}>
            <Image
              source={currentImage}
              style={{ width: SCREEN_WIDTH * 0.44, height: SCREEN_WIDTH * 0.44 }}
              resizeMode="contain"
            />
          </Animated.View>
          <Text style={styles.temperature}>{Math.round(current.temperature)}°</Text>
          <Text style={styles.conditionLabel}>{conditionLabel}</Text>
          <Text style={styles.maxMinDetail}>{maxMinStr}</Text>
        </View>

        {/* House illustration, sitting on the panel */}
        <View style={styles.houseSection}>
          <Animated.View style={[{ width: "100%", height: "100%", marginBottom: -8, zIndex: 2 }, houseStyle]}>
            <Image
              source={HOUSE_IMAGE}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* Bottom panel: same gradient with a subtle glass layer */}
        <View
          style={[
            styles.panel,
            { zIndex: 1, paddingBottom: insets.bottom },
          ]}
        >
          <View style={styles.todayHeader}>
            <Text style={styles.todayTitle}>Today</Text>
            <Text style={styles.todayDate}>{formattedDate}</Text>
          </View>

          <View style={styles.hourlyList}>
            {(() => {
              const currentHourStart = current.time
                ? `${current.time.slice(0, 13)}:00`
                : "";
              let startIdx = hourly.findIndex((h) => h.time >= currentHourStart);
              if (startIdx < 0) startIdx = 0;
              const nextFourHours = hourly.slice(startIdx, startIdx + 4);
              console.log(
                "Next 4 hourly temperatures:",
                nextFourHours.map((h) => h.temperature)
              );
              return nextFourHours;
            })().map((hour, index) => {
              const hh = hour.time.slice(11, 13);
              const mm = hour.time.slice(14, 16);
              const hourTime = `${hh}.${mm}`;
              const hourIconName = getWeatherImageKey(hour.iconName, hour.isDay);
              const hourImage =
                WEATHER_IMAGES[hourIconName] || WEATHER_IMAGES.cloudy;
              return (
                <React.Fragment key={index}>
                  <View style={styles.hourlyItem}>
                    <Text style={styles.hourlyTemp}>{Math.round(hour.temperature)}°C</Text>
                    <Image
                      source={hourImage}
                      style={{ width: 36, height: 36, marginVertical: 6 }}
                      resizeMode="contain"
                    />
                    <Text style={styles.hourlyTime}>{hourTime}</Text>
                  </View>
                  {index < 3 && <View style={styles.divider} />}
                </React.Fragment>
              );
            })}
          </View>

          <View style={styles.bottomBarRow}>
            <TouchableOpacity
              onPress={handleCurrentLocation}
              disabled={locating}
              style={locating ? { opacity: 0.5 } : undefined}
            >
              <Ionicons name="location-outline" size={26} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="add-circle-outline" size={32} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/details" as never,
                  params: { lat: String(lat), lon: String(lon), city: cityName, country },
                })
              }
            >
              <Ionicons name="menu-outline" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
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

  gradient: {
    flex: 1,
    width: "100%",
    height: "100%",
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

  heroSection: {
    alignItems: "center",
    marginTop: 8,
  },

  temperature: {
    fontSize: 56,
    lineHeight: 64,
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    marginTop: -12,
    includeFontPadding: false,
  },

  conditionLabel: {
    fontSize: 16,
    lineHeight: 22,
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
  },

  maxMinDetail: {
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginTop: 2,
  },

  houseSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 10,
    marginVertical: 0,
  },

  panel: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  todayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 6,
  },

  todayTitle: {
    fontSize: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  hourlyItem: {
    flex: 1,
    alignItems: "center",
  },

  divider: {
    width: 1,
    height: 56,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  hourlyTemp: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
  },

  hourlyTime: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Poppins_400Regular",
  },

  bottomBarRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 12,
  },
});
