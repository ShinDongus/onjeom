import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Ellipse } from "react-native-svg";
import AppIcon from "./AppIcon";
import { Text, TextInput } from "./Type";
import { diary, typography, ink, muted, line } from "./diary-theme";
import PlantMoment from "./PlantMoment";
import ActionButton from "./ActionButton";
import { useReducedMotion } from "./Motion";
type Props = {
  current?: { id: string; title: string };
  progress: number;
  busy: boolean;
  onComplete: () => void;
  onLater: () => Promise<unknown> | void;
  onSplit: (steps: string[]) => void;
  onCompose: () => void;
  onBack: () => void;
  bloom?: any;
  onFlower: () => void;
};
export default function FocusScreen({
  current,
  progress,
  busy,
  onComplete,
  onLater,
  onSplit,
  onCompose,
  onBack,
  bloom,
  onFlower,
}: Props) {
  const { height } = useWindowDimensions(),
    reduced = useReducedMotion(),
    travel = useRef(new Animated.Value(0)).current;
  const [splitting, setSplitting] = useState(false),
    [parts, setParts] = useState(["", ""]),
    [moving, setMoving] = useState(false);
  useEffect(() => {
    travel.setValue(0);
    setSplitting(false);
    setParts(["", ""]);
    setMoving(false);
  }, [current?.id]);
  const later = () => {
    if (busy || moving) return;
    setMoving(true);
    Animated.timing(travel, {
      toValue: 1,
      duration: reduced ? 150 : 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      void Promise.resolve(onLater()).finally(() => {
        travel.setValue(0);
        setMoving(false);
      });
    });
  };
  return (
    <View
      style={[s.page, { minHeight: Math.max(0, height - 180) }]}
      testID="one-step-mode"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="오늘로 돌아가기"
        onPress={onBack}
        style={[diary.quiet, { alignSelf: "flex-start" }]}
      >
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <AppIcon name="이전" color={ink} />
          <Text style={typography.action}>오늘로 돌아가기</Text>
        </View>
      </Pressable>
      <Animated.View
        style={[
          s.center,
          {
            opacity: travel.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
            transform: reduced
              ? []
              : [
                  {
                    translateX: travel.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 90],
                    }),
                  },
                  {
                    translateY: travel.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -140],
                    }),
                  },
                  {
                    scale: travel.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.08],
                    }),
                  },
                ],
          },
        ]}
      >
        <Text
          accessibilityRole="header"
          style={[typography.title, { textAlign: "center" }]}
        >
          {current?.title || "잠시, 여백을 누려요."}
        </Text>
      </Animated.View>
      {moving && !reduced && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            alignSelf: "center",
            top: 140,
            opacity: travel.interpolate({
              inputRange: [0, 0.25, 0.8, 1],
              outputRange: [0, 1, 1, 0],
            }),
            transform: [
              {
                translateX: travel.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 90],
                }),
              },
              {
                translateY: travel.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -140],
                }),
              },
            ],
          }}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" aria-hidden>
            <Ellipse
              cx={12}
              cy={12}
              rx={6}
              ry={4}
              fill="#9B8766"
              transform="rotate(-25 12 12)"
            />
          </Svg>
        </Animated.View>
      )}
      {splitting && (
        <View style={{ gap: 16 }}>
          {parts.map((part, i) => (
            <TextInput
              key={i}
              accessibilityLabel={`작은 단계 ${i + 1}`}
              value={part}
              onChangeText={(value) =>
                setParts((s) => s.map((text, j) => (j === i ? value : text)))
              }
              placeholder={`${i + 1}번째 작은 행동`}
              placeholderTextColor={muted}
              multiline
              maxLength={500}
              style={s.input}
            />
          ))}
          {parts.length === 2 && (
            <ActionButton
              title="작은 단계 하나 더 적기"
              secondary
              onPress={() => setParts([...parts, ""])}
            />
          )}
          <ActionButton
            title="나누기 취소"
            secondary
            onPress={() => setSplitting(false)}
          />
        </View>
      )}
      <PlantMoment progress={progress} bloom={bloom} onFlower={onFlower} />
      <View style={{ gap: 16 }}>
        {current ? (
          <>
            <ActionButton
              title={splitting ? "작은 단계로 바꾸기" : "완료했어요"}
              disabled={
                busy || moving || (splitting && parts.some((p) => !p.trim()))
              }
              onPress={() => (splitting ? onSplit(parts) : onComplete())}
            />
            <View style={s.secondary}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="더 작게 나누기"
                onPress={() => setSplitting(true)}
                disabled={busy || moving}
                style={diary.quiet}
              >
                <Text style={typography.action}>더 작게 나누기</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="나중에 하기"
                onPress={later}
                disabled={busy || moving}
                style={diary.quiet}
              >
                <Text style={typography.action}>나중에 하기</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <ActionButton title="오늘의 다이어리에 적기" onPress={onCompose} />
        )}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  page: { gap: 32, flex: 1 },
  center: { flex: 1, minHeight: 120, justifyContent: "center" },
  secondary: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  input: {
    ...typography.body,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: line,
    color: ink,
    padding: 0,
    backgroundColor: "transparent",
  },
});
