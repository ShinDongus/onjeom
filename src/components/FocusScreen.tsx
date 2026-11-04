import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import GardenScene from "./GardenScene";
type Props = {
  current?: { title: string };
  progress: number;
  season: string;
  busy: boolean;
  onComplete: () => void;
  onLater: () => void;
  onSplit: () => void;
  onCompose: () => void;
};
export default function FocusScreen({
  current,
  progress,
  season,
  busy,
  onComplete,
  onLater,
  onSplit,
  onCompose,
}: Props) {
  const { height } = useWindowDimensions();
  return (
    <View style={s.page}>
      <View style={s.top}>
        <View style={s.badge}>
          <View style={s.dot} />
          <Text style={s.badgeText}>지금은, 하나만</Text>
        </View>
      </View>
      <Text accessibilityRole="header" style={s.title}>
        {current?.title || "잠시, 여백을 누려요."}
      </Text>
      <Text style={s.helper}>
        {current
          ? "나머지 생각은 잠시 맡겨두세요."
          : "다음 한 걸음은 준비됐을 때 시작해요."}
      </Text>
      <View style={s.scene}>
        <GardenScene
          caption={false}
          season={season}
          progress={progress}
          height={Math.max(140, Math.min(260, height - 510))}
        />
      </View>
      <View style={s.actions}>
        <View style={s.progress}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[s.pip, i < progress && s.pipDone]} />
          ))}
          <Text style={s.progressText}>
            다음 꽃까지 {4 - progress}번의 작은 행동
          </Text>
        </View>
        {current ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="이만큼 해냈어요 · 완료"
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={onComplete}
              style={({ pressed }) => [
                s.complete,
                (pressed || busy) && { opacity: 0.7 },
              ]}
            >
              <Text style={s.check}>✓</Text>
              <Text style={s.completeText}>이만큼 해냈어요 · 완료</Text>
            </Pressable>
            <View style={s.secondaryRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="나중에 하기 · 씨앗에 보관"
                accessibilityState={{ disabled: busy }}
                disabled={busy}
                onPress={onLater}
                style={s.secondary}
              >
                <Text style={s.symbol}>↗</Text>
                <Text style={s.secondaryText}>나중에 하기</Text>
              </Pressable>
              <View style={s.divider} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="작은 단계로 나누기"
                onPress={onSplit}
                style={s.secondary}
              >
                <Text style={s.symbol}>⋮</Text>
                <Text style={s.secondaryText}>작은 단계로 나누기</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={onCompose}
            style={s.complete}
          >
            <Text style={s.completeText}>생각 꺼내놓기</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  page: { marginHorizontal: -20 },
  top: { alignItems: "center", paddingTop: 12, paddingBottom: 24 },
  badge: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#e6ebdb",
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#779169" },
  badgeText: { fontSize: 11, color: "#64795d" },
  title: {
    fontSize: 26,
    lineHeight: 38,
    fontWeight: "600",
    textAlign: "center",
    color: "#304b36",
    paddingHorizontal: 28,
    letterSpacing: -0.7,
  },
  helper: {
    color: "#85917c",
    fontSize: 12,
    textAlign: "center",
    paddingTop: 10,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  scene: {
    marginTop: 16,
    marginHorizontal: 26,
    overflow: "hidden",
    borderRadius: 120,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  actions: { paddingHorizontal: 22, paddingTop: 22, gap: 12 },
  progress: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginBottom: 7,
  },
  pip: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#dce3cf" },
  pipDone: { backgroundColor: "#718c61" },
  progressText: { color: "#839176", fontSize: 10, marginLeft: 5 },
  complete: {
    backgroundColor: "#4b6b50",
    minHeight: 60,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 12,
    padding: 12,
    shadowColor: "#435d3c",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  check: { color: "#cfdfbc", fontSize: 22 },
  completeText: { color: "#fffef4", fontSize: 16, fontWeight: "600" },
  secondaryRow: { flexDirection: "row", alignItems: "center" },
  secondary: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  secondaryText: { color: "#76836b", fontSize: 12 },
  symbol: { color: "#98a489", fontSize: 19 },
  divider: { width: 1, height: 16, backgroundColor: "#dce1cf" },
});
