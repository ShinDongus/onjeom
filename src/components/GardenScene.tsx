import React, { useId } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Ellipse,
  Circle,
  G,
} from "react-native-svg";
import FlowerArt from "./FlowerArt";
const seasons: Record<string, string[]> = {
  봄: ["#edf1d9", "#d4dfc4", "#b7c7a7"],
  여름: ["#e1eee1", "#bcd5be", "#93b69b"],
  가을: ["#f4ead5", "#e0d7b9", "#bfc5a4"],
  겨울: ["#e9f0eb", "#cadbd4", "#a8c1b7"],
};
export default function GardenScene({
  season,
  progress,
  height = 320,
  caption = true,
}: {
  season: string;
  progress: number;
  height?: number;
  caption?: boolean;
}) {
  const id = useId().replace(/:/g, ""),
    c = seasons[season] || seasons.봄;
  return (
    <View
      style={[s.scene, { height }]}
      accessibilityLabel={`${season}의 온실, 성장 ${progress}/4`}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 380 340"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <Defs>
          <LinearGradient id={`${id}wall`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#fcf9ec" />
            <Stop offset="1" stopColor="#e1e5d6" />
          </LinearGradient>
          <LinearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={c[0]} />
            <Stop offset="1" stopColor={c[1]} />
          </LinearGradient>
          <LinearGradient id={`${id}stone`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#fcf8e9" />
            <Stop offset="1" stopColor="#d8d4c1" />
          </LinearGradient>
          <LinearGradient id={`${id}light`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#fffdf0" stopOpacity=".65" />
            <Stop offset="1" stopColor="#fffdf0" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d="M0 0H380V340H0Z" fill={`url(#${id}wall)`} />
        <Path d="M67 236V111A123 123 0 0 1 313 111V236Z" fill="#c9cfba" />
        <Path
          d="M76 231V111A114 114 0 0 1 304 111V231Z"
          fill={`url(#${id}sky)`}
        />
        <Circle cx="245" cy="78" r="29" fill="#fff4cc" opacity=".9" />
        <Path
          d="M76 186Q128 134 204 180T304 170V231H76Z"
          fill={c[2]}
          opacity=".6"
        />
        <Path
          d="M76 207Q164 169 228 208T304 201V231H76Z"
          fill="#93ae8c"
          opacity=".38"
        />
        <Path d="M190 5V231M76 125H304" stroke="#f9f7e9" strokeWidth="6" />
        <Path d="M76 231H304L324 243H56Z" fill="#f9f5e6" />
        <Path d="M56 243H324V250H56Z" fill="#d7d5be" />
        <Path d="M85 45 279 0 380 237 234 295Z" fill={`url(#${id}light)`} />
        <Path d="M0 275 380 251V340H0Z" fill="#e3e3d1" />
        <Path d="M0 275 380 251" stroke="#f5f2e6" strokeWidth="2" />
        <Ellipse
          cx="211"
          cy="307"
          rx="103"
          ry="18"
          fill="#78856c"
          opacity=".09"
        />
        <Path
          d="M90 270H290V290C290 310 90 310 90 290Z"
          fill={`url(#${id}stone)`}
        />
        <Ellipse cx="190" cy="270" rx="100" ry="25" fill="#fbf7e8" />
        <Ellipse cx="190" cy="267" rx="89" ry="19" fill="#eeebda" />
        <G opacity=".8">
          <Path
            d="M25 248Q37 206 16 173Q2 203 25 224Q21 174 41 157Q58 194 30 224M28 255Q16 218 2 219Q3 240 28 255"
            fill="#9daf8f"
          />
          <Path
            d="M353 250Q336 208 354 181Q373 211 353 228Q370 186 381 192Q385 223 353 250"
            fill="#9bad8d"
          />
        </G>
        <Ellipse cx="326" cy="281" rx="15" ry="5" fill="#c6cdb6" />
        <Path d="M315 275Q323 262 334 272Q338 282 325 282Z" fill="#d1ccb2" />
      </Svg>
      <View style={s.plant}>
        <FlowerArt stage={progress} size={height * 0.56} />
      </View>
      {caption && (
        <View style={s.corner}>
          <View style={s.dot} />
          <Text style={s.cornerText}>{season}의 빛</Text>
        </View>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  scene: { width: "100%", overflow: "hidden" },
  plant: { position: "absolute", alignSelf: "center", bottom: "12%" },
  corner: {
    position: "absolute",
    right: 22,
    top: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    backgroundColor: "#fffdf0bb",
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  cornerText: { fontSize: 10, color: "#758269" },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#a8b38b" },
});
