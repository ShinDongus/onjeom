import React from "react";
import Svg, { Path, Circle, Rect } from "react-native-svg";
export default function AppIcon({
  name,
  color = "#81917a",
}: {
  name: string;
  color?: string;
}) {
  return (
    <Svg
      width={21}
      height={21}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={true}
    >
      {name === "오늘" ? (
        <>
          <Path d="M5 3h14v18H5zM8 3v18M11 8h5M11 12h5M11 16h3" />
        </>
      ) : name === "실행" ? (
        <>
          <Circle cx={12} cy={12} r={8} />
          <Path d="m8 12 3 3 5-6" />
        </>
      ) : name === "정원" ? (
        <>
          <Path d="M12 21v-9M12 13C5 14 3 10 4 5c6 0 9 3 8 8ZM12 15c7 1 9-3 8-8-6 0-9 3-8 8Z" />
        </>
      ) : name === "도감" ? (
        <>
          <Path d="M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-3-1-6-1-10 1ZM12 5v15" />
          <Path d="M6 8h3M15 8h3" />
        </>
      ) : name === "기록" ? (
        <>
          <Rect x={3} y={5} width={18} height={16} rx={2} />
          <Path d="M3 10h18M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2" />
        </>
      ) : name === "씨앗" ? (
        <>
          <Rect x={4} y={7} width={16} height={13} rx={3} />
          <Path d="M3 7h18M9 12h6M8 4h8" />
        </>
      ) : (
        <>
          <Circle cx={12} cy={12} r={3} />
          <Path d="m9 3-.8 2.5-2.6.5.4 2.5L4 10v4l2 1.5-.4 2.5 2.6.5L9 21h6l.8-2.5 2.6-.5-.4-2.5 2-1.5v-4l-2-1.5.4-2.5-2.6-.5L15 3Z" />
        </>
      )}
    </Svg>
  );
}
