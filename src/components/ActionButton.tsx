import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import { Text } from "./Type";
import { typography, sage, paper, sand, ink, muted } from "./diary-theme";
import { useReducedMotion } from "./Motion";
export default function ActionButton({
  title,
  onPress,
  secondary = false,
  disabled = false,
  loading = false,
  testID,
  badge,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  badge?: string;
}) {
  const reduced = useReducedMotion(),
    pressed = useRef(new Animated.Value(0)).current,
    breath = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!loading || reduced) {
      breath.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 0.4,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [loading, reduced]);
  const touch = (value: number) =>
    Animated.timing(pressed, {
      toValue: value,
      duration: reduced ? 150 : 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  const inactive = disabled && !loading;
  return (
    <Animated.View
      style={{
        transform: reduced
          ? []
          : [
              {
                scale: pressed.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.985],
                }),
              },
            ],
      }}
    >
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        aria-busy={loading}
        disabled={disabled || loading}
        onPressIn={() => touch(1)}
        onPressOut={() => touch(0)}
        onPress={() => {
          if (Platform.OS !== "web")
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
              () => {},
            );
          onPress();
        }}
      >
        <Animated.View
          style={[
            s.button,
            secondary && s.secondary,
            {
              backgroundColor: inactive
                ? sand
                : secondary
                  ? sand
                  : pressed.interpolate({
                      inputRange: [0, 1],
                      outputRange: [sage, "#52664E"],
                    }),
            },
          ]}
        >
          {loading ? (
            <View style={s.loading}>
              <Animated.View style={{ opacity: breath }}>
                <Svg width={22} height={22} viewBox="0 0 24 24" aria-hidden>
                  <Path
                    d="M12 21V10M12 12Q3 12 4 4Q12 3 12 12M12 15Q21 15 21 7Q12 6 12 15"
                    fill="none"
                    stroke={paper}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                </Svg>
              </Animated.View>
              <Text
                style={[typography.action, { color: paper, flexShrink: 1 }]}
              >
                생각을 차분히 정리하고 있어요...
              </Text>
            </View>
          ) : (
            <Text
              style={[
                typography.action,
                {
                  color: inactive ? muted : secondary ? ink : paper,
                  opacity: inactive ? 0.6 : 1,
                  textAlign: "center",
                },
              ]}
            >
              {title}
              {badge ? `  [${badge}]` : ""}
            </Text>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
const s = StyleSheet.create({
  button: {
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 0,
  },
  secondary: { minHeight: 44, paddingVertical: 12, paddingHorizontal: 16 },
  loading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
