import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import GardenScene from "./GardenScene";
type Props = {
  season: string;
  day: string;
  progress: number;
  completed: number;
  flowers: number;
  current?: { title: string };
  remaining: number;
  onCompose: () => void;
  onStart: () => void;
  onManage: () => void;
  onGarden: () => void;
};
export default function HomeScreen({
  season,
  day,
  progress,
  completed,
  flowers,
  current,
  remaining,
  onCompose,
  onStart,
  onManage,
  onGarden,
}: Props) {
  const height = useWindowDimensions().height;
  return (
    <View style={s.page}>
      <View style={s.heading}>
        <Text style={s.date}>
          {Number(day.slice(5, 7))}월 {Number(day.slice(8))}일 · {season}
        </Text>
        <Text accessibilityRole="header" style={s.title}>
          오늘은,{"\n"}한 걸음이면 충분해요.
        </Text>
      </View>
      <GardenScene
        season={season}
        progress={progress}
        variant="home"
        height={Math.max(156, Math.min(216, height * 0.26))}
      />
      {current ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="지금 할 일 이어서 하기"
          onPress={onStart}
          style={s.next}
        >
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={s.kicker}>지금의 한 걸음</Text>
            <Text numberOfLines={2} style={s.task}>
              {current.title}
            </Text>
          </View>
          <Text style={s.chevron}>↗</Text>
        </Pressable>
      ) : (
        <View style={s.empty}>
          <Text style={s.task}>마음에 남은 생각이 있나요?</Text>
          <Text style={s.description}>정리되지 않은 말이어도 괜찮아요.</Text>
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="생각 꺼내놓기"
        onPress={onCompose}
        style={({ pressed }) => [s.compose, { opacity: pressed ? 0.8 : 1 }]}
      >
        <Text style={s.plus}>＋</Text>
        <Text style={s.composeText}>생각 꺼내놓기</Text>
        <Text style={s.composeArrow}>↗</Text>
      </Pressable>
      <View style={s.bottom}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="할 일 살펴보기·수정"
          onPress={onManage}
          style={s.quiet}
        >
          <Text style={s.meta}>남은 일 {remaining}개</Text>
        </Pressable>
        <View style={s.divider} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="오늘의 정원 보기"
          onPress={onGarden}
          style={s.quiet}
        >
          <Text style={s.meta}>피어난 꽃 {flowers}송이</Text>
        </Pressable>
      </View>
      <Text style={s.footnote}>지금까지 쌓인 작은 행동 {completed}개</Text>
    </View>
  );
}
const s = StyleSheet.create({
  page: { gap: 14 },
  heading: { gap: 12, paddingTop: 8 },
  date: { fontSize: 12, color: "#81917a", letterSpacing: 0.8 },
  title: {
    fontSize: 29,
    lineHeight: 40,
    fontWeight: "600",
    letterSpacing: -1.2,
    color: "#2f4635",
  },
  next: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 22,
    backgroundColor: "#f0eddf",
    padding: 18,
    minHeight: 92,
  },
  kicker: { fontSize: 11, color: "#849176", letterSpacing: 1 },
  task: { fontSize: 17, lineHeight: 25, fontWeight: "500", color: "#3d5341" },
  chevron: { fontSize: 22, color: "#708665" },
  empty: { alignItems: "center", paddingVertical: 9, gap: 5 },
  description: { fontSize: 13, lineHeight: 21, color: "#8a9580" },
  compose: {
    backgroundColor: "#627e65",
    borderRadius: 22,
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    gap: 12,
  },
  plus: { fontSize: 23, color: "#dce5d6" },
  composeText: { fontSize: 17, fontWeight: "600", color: "#fff", flex: 1 },
  composeArrow: { fontSize: 21, color: "#dce5d6" },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  quiet: { minHeight: 40, justifyContent: "center" },
  meta: { fontSize: 12, color: "#78886f" },
  divider: { width: 1, height: 12, backgroundColor: "#d8dfcf" },
  footnote: { fontSize: 11, textAlign: "center", color: "#9aa38e" },
});
