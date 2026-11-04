import React, { useId } from "react";
import Svg, {
  Circle,
  Ellipse,
  Path,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
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
  const id = "pot" + useId().replace(/:/g, "");
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
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#a47b61" />
            <Stop offset=".3" stopColor="#d0ad8e" />
            <Stop offset=".65" stopColor="#c09a7d" />
            <Stop offset="1" stopColor="#a78064" />
          </LinearGradient>
        </Defs>
        {potted && (
          <>
            <Ellipse
              cx="83"
              cy="203"
              rx="38"
              ry="6"
              fill="#52634b"
              opacity=".12"
            />
            <Path d="M52 169H108L101 198Q80 210 59 198Z" fill={`url(#${id})`} />
            <Ellipse cx="80" cy="169" rx="28" ry="9" fill="#dabb9c" />
            <Ellipse cx="80" cy="168" rx="23" ry="6" fill="#73644f" />
          </>
        )}
        {flowerScene({ species, color, stage, potted: false })
          .slice(1)
          .map(
            (
              shape: { tag: keyof typeof shapes; props: Record<string, any> },
              i: number,
            ) => {
              const Element = shapes[shape.tag];
              return <Element key={i} {...shape.props} />;
            },
          )}
        {potted && (
          <>
            <Path
              d="M52 169Q80 180 108 169L101 198Q80 210 59 198Z"
              fill={`url(#${id})`}
            />
            <Path
              d="M52 169Q80 183 108 169"
              stroke="#e0bea0"
              strokeWidth="4"
              fill="none"
            />
            <Path
              d="M61 181 64 195"
              stroke="#ead1b6"
              strokeWidth="2"
              opacity=".5"
              strokeLinecap="round"
            />
          </>
        )}
      </Svg>
    </View>
  );
}
