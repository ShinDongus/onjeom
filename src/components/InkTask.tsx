import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Text } from "./Type";
import { ink, line, muted, sage, typography } from "./diary-theme";
import { useReducedMotion } from "./Motion";
export default function InkTask({
  title,
  checked = false,
  onOpen,
  onComplete,
  disabled = false,
}: {
  title: string;
  checked?: boolean;
  onOpen?: () => void;
  onComplete?: () => void;
  disabled?: boolean;
}) {
  const reduced = useReducedMotion(),
    fill = useRef(new Animated.Value(0)).current;
  const [finished, setFinished] = useState(false),
    [width, setWidth] = useState(0);
  useEffect(() => {
    setFinished(reduced);
    const animation = Animated.timing(fill, {
      toValue: checked ? 1 : 0,
      duration: reduced ? 0 : 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start((result) => {
      if (result.finished) setFinished(true);
    });
    return () => animation.stop();
  }, [checked, reduced]);
  return (
    <View style={s.row} testID={checked ? "today-completed" : "today-active"}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={checked ? `${title} 완료됨` : `${title} 완료하기`}
        accessibilityState={{ disabled: disabled || checked }}
        disabled={disabled || checked}
        onPress={onComplete}
        style={s.touch}
      >
        <View style={s.circle}>
          <Animated.View
            style={[s.fill, { opacity: fill, transform: [{ scale: fill }] }]}
          />
          <Svg width={16} height={16} viewBox="0 0 24 24" aria-hidden>
            <Path
              d={checked ? "m5 12 5 5L19 7" : ""}
              fill="none"
              stroke="#FAF6EB"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole={checked ? "checkbox" : "button"}
        accessibilityLabel={checked ? title : `${title} 한 걸음 시작하기`}
        aria-checked={checked ? true : undefined}
        accessibilityState={checked ? { checked: true, disabled: true } : {}}
        disabled={checked}
        onPress={onOpen}
        style={s.title}
      >
        <Text
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
          style={[
            typography.body,
            {
              color: checked ? muted : ink,
              alignSelf: "flex-start",
              textDecorationLine:
                checked && (reduced || finished) ? "line-through" : "none",
            },
          ]}
        >
          {title}
        </Text>
        {checked && !reduced && !finished && (
          <Animated.View
            pointerEvents="none"
            style={[
              s.strike,
              {
                width: fill.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, width],
                }),
              },
            ]}
          />
        )}
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: "row-reverse", alignItems: "center", minHeight: 44 },
  touch: {
    width: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: line,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: sage,
    borderRadius: 999,
  },
  title: {
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    position: "relative",
    paddingVertical: 8,
  },
  strike: {
    height: 1,
    backgroundColor: muted,
    position: "absolute",
    left: 0,
    top: "50%",
  },
});
