// services/weatherService.ts
// Weather service using the free Open-Meteo API (no API key required)

// Types

export interface CityResult {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  temperature: number;
  weatherCode: number;
  weatherLabel: string;
  iconName: string;
  isDay: boolean;
  time: string;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  iconName: string;
  weatherLabel: string;
}

export interface DailyForecast {
  date: string;
  weatherCode: number;
  weatherLabel: string;
  iconName: string;
  tempMax: number;
  tempMin: number;
  sunrise: string;
  sunset: string;
  uvIndex: number;
}

export interface WeatherData {
  current: CurrentWeather;
  todayMax: number;
  todayMin: number;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  sunrise: string;
  sunset: string;
  uvIndex: number;
}

export interface AirQualityData {
  usAqi: number;
}

export interface WeatherCodeInfo {
  label: string;
  iconName: string;
}

// WMO Weather Code Mapping

const WEATHER_CODE_MAP: Record<number, { day: string; night: string; iconName: string }> = {
  0: { day: "Clear sky", night: "Clear sky", iconName: "sunny" },
  1: { day: "Mainly clear", night: "Mainly clear", iconName: "sunny" },
  2: { day: "Partly cloudy", night: "Partly cloudy", iconName: "partly-cloudy" },
  3: { day: "Overcast", night: "Overcast", iconName: "cloudy" },
  45: { day: "Fog", night: "Fog", iconName: "fog" },
  48: { day: "Depositing rime fog", night: "Depositing rime fog", iconName: "fog" },
  51: { day: "Light drizzle", night: "Light drizzle", iconName: "rain" },
  53: { day: "Moderate drizzle", night: "Moderate drizzle", iconName: "rain" },
  55: { day: "Dense drizzle", night: "Dense drizzle", iconName: "rain" },
  56: { day: "Light freezing drizzle", night: "Light freezing drizzle", iconName: "rain" },
  57: { day: "Dense freezing drizzle", night: "Dense freezing drizzle", iconName: "rain" },
  61: { day: "Slight rain", night: "Slight rain", iconName: "rain" },
  63: { day: "Moderate rain", night: "Moderate rain", iconName: "rain" },
  65: { day: "Heavy rain", night: "Heavy rain", iconName: "rain" },
  66: { day: "Light freezing rain", night: "Light freezing rain", iconName: "rain" },
  67: { day: "Heavy freezing rain", night: "Heavy freezing rain", iconName: "rain" },
  71: { day: "Slight snow", night: "Slight snow", iconName: "snow" },
  73: { day: "Moderate snow", night: "Moderate snow", iconName: "snow" },
  75: { day: "Heavy snow", night: "Heavy snow", iconName: "snow" },
  77: { day: "Snow grains", night: "Snow grains", iconName: "snow" },
  80: { day: "Slight rain showers", night: "Slight rain showers", iconName: "rain" },
  81: { day: "Moderate rain showers", night: "Moderate rain showers", iconName: "rain" },
  82: { day: "Violent rain showers", night: "Violent rain showers", iconName: "rain" },
  85: { day: "Slight snow showers", night: "Slight snow showers", iconName: "snow" },
  86: { day: "Heavy snow showers", night: "Heavy snow showers", iconName: "snow" },
  95: { day: "Thunderstorm", night: "Thunderstorm", iconName: "thunderstorm" },
  96: { day: "Thunderstorm with slight hail", night: "Thunderstorm with slight hail", iconName: "thunderstorm" },
  99: { day: "Thunderstorm with heavy hail", night: "Thunderstorm with heavy hail", iconName: "thunderstorm" },
};

/**
 * Map a WMO weather code to a human-readable label and icon name.
 * @param code - WMO weather code
 * @param isDay - Whether it's daytime (affects label for some codes)
 * @returns { label, iconName }
 */
export function mapWeatherCode(code: number, isDay: boolean = true): WeatherCodeInfo {
  const entry = WEATHER_CODE_MAP[code];
  if (!entry) {
    return { label: "Unknown", iconName: "cloudy" };
  }
  return {
    label: isDay ? entry.day : entry.night,
    iconName: entry.iconName,
  };
}

// API helpers

const GEOCODING_BASE = "https://geocoding-api.open-meteo.com/v1";
const WEATHER_BASE = "https://api.open-meteo.com/v1";
const AIR_QUALITY_BASE = "https://air-quality-api.open-meteo.com/v1";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
  return data as T;
}

// 1. searchCity

interface GeocodingResponse {
  results?: Array<{
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  }>;
}

export async function searchCity(query: string): Promise<CityResult[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    const url = `${GEOCODING_BASE}/search?name=${encodeURIComponent(
      query.trim()
    )}&count=10&language=en&format=json`;

    const data = await fetchJson<GeocodingResponse>(url);

    if (!data.results || data.results.length === 0) {
      return [];
    }

    return data.results.map((r) => ({
      name: r.name,
      country: r.country,
      latitude: r.latitude,
      longitude: r.longitude,
    }));
  } catch (error) {
    console.error("searchCity error:", error);
    throw new Error(
      `Failed to search cities: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// 2. getWeather

interface WeatherApiResponse {
  current: {
    temperature_2m: number;
    weather_code: number;
    is_day: number;
    precipitation: number;
    time: string;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    is_day: number[];
  };
}

export async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  try {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      current: "temperature_2m,weather_code,is_day",
      hourly: "temperature_2m,weather_code,is_day",
      daily:
        "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max",
      timezone: "auto",
      forecast_days: "7",
    });

    const url = `${WEATHER_BASE}/forecast?${params.toString()}`;
    const data = await fetchJson<WeatherApiResponse>(url);

    const isDay = data.current.is_day === 1;
    const currentInfo = mapWeatherCode(data.current.weather_code, isDay);
    const currentTime: string = data.current.time;

    const current: CurrentWeather = {
      temperature: data.current.temperature_2m,
      weatherCode: data.current.weather_code,
      weatherLabel: currentInfo.label,
      iconName: currentInfo.iconName,
      isDay,
      time: currentTime,
    };

    const hourly: HourlyForecast[] = [];
    for (let i = 0; i < data.hourly.time.length; i++) {
      const hourIsDay = data.hourly.is_day[i] === 1;
      const hourInfo = mapWeatherCode(data.hourly.weather_code[i], hourIsDay);
      hourly.push({
        time: data.hourly.time[i],
        temperature: data.hourly.temperature_2m[i],
        weatherCode: data.hourly.weather_code[i],
        isDay: hourIsDay,
        iconName: hourInfo.iconName,
        weatherLabel: hourInfo.label,
      });
    }

    const daily: DailyForecast[] = data.daily.time.map((date, i) => {
      const code = data.daily.weather_code[i];
      const info = mapWeatherCode(code, true);
      return {
        date,
        weatherCode: code,
        weatherLabel: info.label,
        iconName: info.iconName,
        tempMax: data.daily.temperature_2m_max[i],
        tempMin: data.daily.temperature_2m_min[i],
        sunrise: data.daily.sunrise[i],
        sunset: data.daily.sunset[i],
        uvIndex: data.daily.uv_index_max[i],
      };
    });

    return {
      current,
      todayMax: data.daily.temperature_2m_max[0],
      todayMin: data.daily.temperature_2m_min[0],
      hourly,
      daily,
      sunrise: data.daily.sunrise[0],
      sunset: data.daily.sunset[0],
      uvIndex: data.daily.uv_index_max[0],
    };
  } catch (error) {
    console.error("getWeather error:", error);
    throw new Error(
      `Failed to fetch weather: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// 3. getAirQuality

interface AirQualityResponse {
  current: {
    us_aqi: number;
  };
}

export async function getAirQuality(lat: number, lon: number): Promise<AirQualityData> {
  try {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      current: "us_aqi",
      timezone: "auto",
    });

    const url = `${AIR_QUALITY_BASE}/air-quality?${params.toString()}`;
    const data = await fetchJson<AirQualityResponse>(url);

    return {
      usAqi: data.current.us_aqi,
    };
  } catch (error) {
    console.error("getAirQuality error:", error);
    throw new Error(
      `Failed to fetch air quality: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Default export

export default {
  searchCity,
  getWeather,
  getAirQuality,
  mapWeatherCode,
};