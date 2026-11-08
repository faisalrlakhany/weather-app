import { Dimensions, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { blur } from "expo-blur";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Poppins font weights
export const FONT = {
  REGULAR: "Poppins_400_Regular",
  SEMIBOLD: "Poppins_600_SemiBold",
  BOLD: "Poppins_700_Bold",
};

// Color palette
export const COLORS = {
  // Background gradient colors
  DEEP_NAVY: "#1B1840",
  PURPLE: "#6B3FA0",
  LIGHT_VIOLET: "#A97BE0",
  // Primary accent
  GOLD: "#E6B325",
  // Text colors
  WHITE: "#FFFFFF",
  MUTED_WHITE: "rgba(255, 255, 255, 0.65)",
  // Glassmorphism
  GLASS_BG: "rgba(255, 255, 255, 0.12)",
  GLASS_BORDER: "rgba(255, 255, 255, 0.2)",
};

// Spacing scale (based on 8px grid)
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 24,
  XXL: 32,
};

// Border radius scale
export const BORDER_RADIUS = {
  SM: 8,
  MD: 12,
  LG: 20,
  XL: 24,
  FULL: 9999,
};

// Screen dimensions
export const LAYOUT = {
  SCREEN_WIDTH: SCREEN_WIDTH,
  SCREEN_HEIGHT: SCREEN_HEIGHT,
  BASE_WIDTH: SCREEN_WIDTH < 375 ? 375 : SCREEN_WIDTH,
};

// Linear gradient colors for background
export const GRADIENT_COLORS = [
  COLORS.DEEP_NAVY,
  COLORS.PURPLE,
  COLORS.LIGHT_VIOLET,
];

// Glassmorphism card styles
export const GLASS_STYLES = {
  card: {
    backgroundColor: COLORS.GLASS_BG,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    borderRadius: BORDER_RADIUS.LG,
    backdropFilter: "blur(20px)",
    // minHeight: 180, // Optional: set minimum height for cards
  },
  headerGlass: {
    backgroundColor: COLORS.GLASS_BG,
    borderRadius: BORDER_RADIUS.LG,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    backdropFilter: "blur(20px)",
    padding: SPACING.LG,
  },
};

// Text styles
export const TEXT_STYLES = {
  title: {
    fontFamily: FONT.BOLD,
    fontSize: 32,
    color: COLORS.WHITE,
  },
  subtitle: {
    fontFamily: FONT.SEMIBOLD,
    fontSize: 18,
    color: COLORS.MUTED_WHITE,
  },
  body: {
    fontFamily: FONT.REGULAR,
    fontSize: 14,
    color: COLORS.WHITE,
  },
  bodySecondary: {
    fontFamily: FONT.REGULAR,
    fontSize: 14,
    color: COLORS.MUTED_WHITE,
  },
  button: {
    fontFamily: FONT.SEMIBOLD,
    fontSize: 16,
    color: COLORS.DEEP_NAVY,
  },
};

// Component styles
export const COMPONENT_STYLES = {
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.MD,
  },
  glassCard: {
    ...GLASS_STYLES.card,
    padding: SPACING.LG,
  },
  gradientButton: {
    backgroundColor: COLORS.GOLD,
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.XL,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: "center",
    marginTop: SPACING.SM,
  },
  input: {
    backgroundColor: COLORS.GLASS_BG,
    borderRadius: BORDER_RADIUS.MD,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    fontFamily: FONT.REGULAR,
    fontSize: 14,
    color: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    marginBottom: SPACING.MD,
  },
};

// Export LinearGradient for use in components
export { LinearGradient };

export default StyleSheet;