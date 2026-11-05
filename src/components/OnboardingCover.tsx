import React from "react";
import { Pressable, StyleSheet, View, PanResponder } from "react-native";
import Svg, { Ellipse } from "react-native-svg";
import { Text } from "./Type";
import { typography, paper } from "./diary-theme";
export default function OnboardingCover({
  onOpen,
  busy,
}: {
  onOpen: () => void;
  busy: boolean;
}) {
  const pan = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => !busy && Math.abs(g.dx) > 15,
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.dx) > 40) onOpen();
    },
  });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="다이어리 펼치기"
      disabled={busy}
      onPress={onOpen}
      {...pan.panHandlers}
      style={s.cover}
      testID="onboarding-cover"
    >
      <Text style={[typography.title, { textAlign: "center" }]}>
        복잡한 생각 끝에 온점을 찍고,{"\n"}작은 행동 하나를 시작해보세요.
      </Text>
      <Svg width={32} height={28} viewBox="0 0 32 28" aria-hidden>
        <Ellipse
          cx={16}
          cy={14}
          rx={6}
          ry={4}
          fill="#9B8766"
          transform="rotate(-25 16 14)"
        />
      </Svg>
    </Pressable>
  );
}
const s = StyleSheet.create({
  cover: {
    flex: 1,
    backgroundColor: paper,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
});
