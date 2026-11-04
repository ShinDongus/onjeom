import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { BotanicalSticker } from "./PaperTexture";
import { diary, ink, line, sage, muted } from "./diary-theme";
type Props = {
  current?: { title: string };
  progress: number;
  busy: boolean;
  onComplete: () => void;
  onLater: () => void;
  onSplit: () => void;
  onCompose: () => void;
  onBack: () => void;
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
}: Props) {
  const { height } = useWindowDimensions();
  return (
    <View style={s.page} testID="one-step-mode">
      <Pressable
        accessibilityRole="button"
        onPress={onBack}
        style={[diary.quiet, { alignSelf: "flex-start" }]}
      >
        <Text style={s.back}>‹ 오늘의 페이지</Text>
      </Pressable>
      <Text style={s.eyebrow}>한 걸음 모드</Text>
      <View style={s.task}>
        <Text style={s.number}>하나.</Text>
        <Text accessibilityRole="header" style={s.title}>
          {current?.title || "잠시, 여백을 누려요."}
        </Text>
        <Text style={s.helper}>
          {current
            ? "이것 하나만, 나의 속도로."
            : "다음 한 걸음은 준비됐을 때 시작해요."}
        </Text>
      </View>
      <View style={s.plant}>
        <BotanicalSticker
          size={Math.max(86, Math.min(145, height - 535))}
          stage={progress}
          color="#d8b8bd"
        />
        <View style={s.dots}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[s.dot, i < progress && { backgroundColor: sage }]}
            />
          ))}
        </View>
        <Text style={s.growth}>작은 행동 {4 - progress}개 뒤에 만날 꽃</Text>
      </View>
      {current ? (
        <View style={s.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="완료했어요"
            disabled={busy}
            accessibilityState={{ disabled: busy }}
            onPress={onComplete}
            style={[diary.primary, busy && { opacity: 0.5 }]}
          >
            <Text style={diary.primaryText}>✓ 완료했어요</Text>
          </Pressable>
          <View style={s.secondary}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="더 작게 나누기"
              onPress={onSplit}
              style={diary.quiet}
            >
              <Text style={s.back}>더 작게 나누기</Text>
            </Pressable>
            <View style={s.divider} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="나중에 하기"
              onPress={onLater}
              disabled={busy}
              accessibilityState={{ disabled: busy }}
              style={diary.quiet}
            >
              <Text style={s.back}>나중에 하기</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={onCompose}
          style={diary.primary}
        >
          <Text style={diary.primaryText}>오늘의 다이어리에 적기</Text>
        </Pressable>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  page: { gap: 16 },
  back: { color: muted, fontSize: 13 },
  eyebrow: { color: sage, fontSize: 12, textAlign: "center", letterSpacing: 2 },
  task: { gap: 16, paddingVertical: 20 },
  number: { fontSize: 14, color: "#a0a48f", textAlign: "center" },
  title: {
    fontSize: 27,
    lineHeight: 41,
    color: ink,
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: -0.8,
  },
  helper: { fontSize: 12, color: muted, textAlign: "center" },
  plant: { alignItems: "center", gap: 10 },
  dots: { flexDirection: "row", gap: 6 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#e0e3d2" },
  growth: { fontSize: 11, color: muted },
  actions: { gap: 12, paddingTop: 8 },
  secondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  divider: { height: 14, width: 1, backgroundColor: line },
});
