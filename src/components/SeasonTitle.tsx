import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Ellipse, Path, Circle } from "react-native-svg";
import { Text } from "./Type";
import { typography, floral } from "./diary-theme";
export default function SeasonTitle({ season }: { season: string }) {
  const wash = (
    { 봄: floral, 여름: "#A8B99A", 가을: "#C6B088", 겨울: "#B9C9CC" } as Record<
      string,
      string
    >
  )[season];
  return (
    <View style={s.title}>
      <Svg
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
        viewBox="0 0 342 64"
        preserveAspectRatio="xMaxYMid meet"
        aria-hidden
      >
        <Ellipse cx={286} cy={32} rx={48} ry={24} fill={wash} opacity={0.16} />
        <Ellipse cx={301} cy={28} rx={30} ry={19} fill={wash} opacity={0.13} />
        <Path
          d="M264 50Q282 28 313 12M280 34Q265 20 270 15Q283 16 280 34M295 24Q305 34 314 27Q313 17 295 24"
          fill="#A8B99A"
          opacity={0.38}
        />
        {season === "봄" && (
          <Circle cx={305} cy={14} r={8} fill={floral} opacity={0.45} />
        )}
      </Svg>
      <Text accessibilityRole="header" style={typography.title}>
        {season}의 정원
      </Text>
    </View>
  );
}
const s = StyleSheet.create({
  title: { minHeight: 64, justifyContent: "center" },
});
