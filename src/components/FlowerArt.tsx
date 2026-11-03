import React from "react";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import { View } from "react-native";
import { flowerScene } from "../flower-art.mjs";
type Props = {
  species?: string;
  color?: string;
  stage?: number;
  size?: number;
  potted?: boolean;
};
const shapes = { circle: Circle, ellipse: Ellipse, path: Path };
export default function FlowerArt({
  species = "daisy",
  color = "#EBDDB6",
  stage = 4,
  size = 100,
  potted = true,
}: Props) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ alignSelf: "center", width: size, height: (size * 215) / 160 }}
    >
      <Svg
        width={size}
        height={(size * 215) / 160}
        viewBox="0 0 160 215"
        aria-hidden={true}
      >
        {flowerScene({ species, color, stage, potted }).map(
          (
            shape: { tag: keyof typeof shapes; props: Record<string, any> },
            i: number,
          ) => {
            const Element = shapes[shape.tag];
            return <Element key={i} {...shape.props} />;
          },
        )}
      </Svg>
    </View>
  );
}
