import React, { useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  Defs,
  Pattern,
  Path,
  Circle,
  Rect,
  Ellipse,
} from "react-native-svg";
import FlowerArt from "./FlowerArt";
export default function DiaryPaper() {
  const id = "paper" + useId().replace(/:/g, "");
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width="100%" height="100%" aria-hidden>
        <Defs>
          <Pattern id={id} width="54" height="67" patternUnits="userSpaceOnUse">
            <Circle cx="7" cy="15" r=".6" fill="#b5a98f" opacity=".14" />
            <Circle cx="31" cy="52" r=".5" fill="#b5a98f" opacity=".15" />
            <Path
              d="m18 38 3-1m22-15 3 1"
              stroke="#c1b69a"
              strokeWidth=".45"
              opacity=".15"
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
        <Path
          d="M9 0V2000M12 0V2000"
          stroke="#b9ad91"
          strokeWidth=".6"
          opacity=".12"
        />
      </Svg>
    </View>
  );
}
export function BotanicalSticker({
  species = "cosmos",
  color = "#dcbcc4",
  size = 90,
  stage = 4,
}: {
  species?: string;
  color?: string;
  size?: number;
  stage?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size * 1.34,
        alignItems: "center",
        justifyContent: "center",
        transform: [{ rotate: "-8deg" }],
      }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg
        width={size}
        height={size * 1.34}
        style={StyleSheet.absoluteFill}
        viewBox="0 0 100 134"
        aria-hidden
      >
        <Ellipse cx="50" cy="72" rx="39" ry="46" fill="#e2e7d1" opacity=".3" />
        <Ellipse cx="56" cy="64" rx="33" ry="43" fill="#ede5d2" opacity=".25" />
      </Svg>
      <FlowerArt
        species={species}
        color={color}
        stage={stage}
        size={size}
        potted={false}
      />
    </View>
  );
}
