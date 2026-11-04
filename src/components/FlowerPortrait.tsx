import React, { useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  Stop,
  Path,
} from "react-native-svg";
import FlowerArt from "./FlowerArt";
/** A quiet reveal, with no particle motion or reward prompts. */
export default function FlowerPortrait({
  species,
  color,
}: {
  species: string;
  color: string;
}) {
  const id = "glow" + useId().replace(/:/g, "");
  return (
    <View
      style={s.portrait}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg
        width="230"
        height="200"
        viewBox="0 0 230 200"
        style={StyleSheet.absoluteFill}
        aria-hidden
      >
        <Defs>
          <RadialGradient id={id}>
            <Stop offset="0" stopColor="#e6ebd5" stopOpacity=".85" />
            <Stop offset="1" stopColor="#f8f7e9" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="115" cy="97" r="93" fill={`url(#${id})`} />
        <Circle cx="48" cy="62" r="2" fill="#c9b88e" opacity=".5" />
        <Circle cx="176" cy="126" r="2" fill="#a4b38d" opacity=".5" />
        <Path
          d="M173 39v10m-5-5h10M51 137v6m-3-3h6"
          stroke="#c5b991"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity=".65"
        />
      </Svg>
      <FlowerArt species={species} color={color} size={132} />
    </View>
  );
}
const s = StyleSheet.create({
  portrait: {
    alignSelf: "center",
    width: 230,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
});
