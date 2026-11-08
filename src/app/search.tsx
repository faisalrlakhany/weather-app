import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { searchCity, type CityResult } from "../../services/weatherService";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeq = useRef(0);

  const runSearch = useCallback(async (searchText: string) => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const cities = await searchCity(searchText);
      if (seq !== requestSeq.current) return; // outdated request, ignore
      setResults(cities);
      setHasSearched(true);
    } catch {
      if (seq !== requestSeq.current) return; // outdated request, ignore
      setResults([]);
      setHasSearched(true);
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
      }
    }
  }, []);

  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      const trimmed = text.trim();
      if (trimmed.length < 2) {
        // invalidate any in-flight request so it never overwrites newer state
        requestSeq.current += 1;
        setResults([]);
        setHasSearched(false);
        setLoading(false);
        return;
      }
      debounceRef.current = setTimeout(() => {
        runSearch(trimmed);
      }, 400);
    },
    [runSearch]
  );

  // clear timers on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      requestSeq.current += 1;
    };
  }, []);

  const handleSelectCity = useCallback((item: CityResult) => {
    router.replace({
      pathname: "/home",
      params: {
        lat: String(item.latitude),
        lon: String(item.longitude),
        city: item.name,
        country: item.country,
      },
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: CityResult }) => {
      const region = (item as { region?: string }).region;
      const subtitle =
        region && region !== item.country
          ? `${region}, ${item.country}`
          : item.country;
      return (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.resultCard}
          onPress={() => handleSelectCity(item)}
        >
          <View style={styles.resultTextWrap}>
            <Text style={styles.resultName}>{item.name}</Text>
            {subtitle ? (
              <Text style={styles.resultSubtitle}>{subtitle}</Text>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      );
    },
    [handleSelectCity]
  );

  return (
    <View style={styles.container}>
      <ExpoStatusBar style="light" />
      <LinearGradient
        colors={["#1B1840", "#2E2068", "#5A33A8", "#8E55C8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      >
        <View style={{ flex: 1, paddingTop: insets.top + 12 }}>
          {/* Top row: back button + search bar */}
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.searchBar}>
              <Ionicons
                name="search-outline"
                size={20}
                color="rgba(255,255,255,0.7)"
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search city or country"
                placeholderTextColor="rgba(255,255,255,0.55)"
                value={query}
                onChangeText={handleChangeText}
                autoFocus
                returnKeyType="search"
                onSubmitEditing={() => {
                  const trimmed = query.trim();
                  if (trimmed.length >= 2) runSearch(trimmed);
                }}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => handleChangeText("")}>
                  <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Results */}
          <FlatList
            data={results}
            keyExtractor={(item, index) => `${item.latitude}-${item.longitude}-${index}`}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 16 },
            ]}
            ListHeaderComponent={
              loading ? (
                <View style={styles.statusWrap}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              ) : undefined
            }
            ListEmptyComponent={
              !loading && hasSearched ? (
                <View style={styles.statusWrap}>
                  <Text style={styles.noResultsText}>No results found</Text>
                </View>
              ) : undefined
            }
          />
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
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#FFFFFF",
    fontFamily: "Poppins_400Regular",
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
  },
  resultTextWrap: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
  },
  resultSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Poppins_400Regular",
    marginTop: 2,
  },
  statusWrap: {
    paddingVertical: 24,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Poppins_400Regular",
  },
});
