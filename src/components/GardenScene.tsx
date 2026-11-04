import React from "react";
import { StyleSheet, Text, View } from "react-native";
import FlowerArt from "./FlowerArt";
type Props = {
  season: string;
  progress: number;
  variant?: "home" | "garden";
  height?: number;
  flowers?: { id: string; speciesId: string; color: string }[];
};
const colors: Record<string, string> = {
  봄: "#edf1e2",
  여름: "#e5eee5",
  가을: "#f2e9d9",
  겨울: "#eaf0f1",
};
export default function GardenScene({
  season,
  progress,
  flowers = [],
  variant = "garden",
  height = 280,
}: Props) {
  const messages = [
    "씨앗은 당신의 속도를 기다려요.",
    "작은 새싹이 고개를 들었어요.",
    "잎사귀가 한 뼘 자랐어요.",
    "이제, 꽃을 만날 준비가 됐어요.",
  ];
  return (
    <View
      style={[
        s.scene,
        { backgroundColor: colors[season], height },
        variant === "home" && {
          borderTopLeftRadius: 160,
          borderTopRightRadius: 160,
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        },
      ]}
      accessibilityLabel={`${season}의 정원, 성장 ${progress}/4`}
    >
      <View style={s.sun} />
      <View style={[s.cloud, { left: 28, top: 54, width: 66 }]} />
      <View style={[s.cloud, { right: 20, top: 81, width: 80 }]} />
      <View style={s.hill} />
      <View style={s.hillBack} />
      <View style={s.plant}>
        <FlowerArt stage={progress} size={variant === "home" ? 120 : 140} />
      </View>
      <View style={s.memories}>
        {flowers.slice(0, 3).map((f) => (
          <FlowerArt
            key={f.id}
            species={f.speciesId}
            color={f.color}
            size={46}
            potted={false}
          />
        ))}
      </View>
      <View style={s.caption}>
        <Text style={s.label}>{messages[progress] || messages[0]}</Text>
        <View style={s.dots}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[s.dot, i < progress && s.filled]} />
          ))}
        </View>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  scene: {
    height: 280,
    borderRadius: 28,
    overflow: "hidden",
    marginVertical: 0,
  },
  sun: {
    position: "absolute",
    right: 42,
    top: 25,
    width: 51,
    height: 51,
    borderRadius: 50,
    backgroundColor: "#f5e7b6",
    opacity: 0.8,
  },
  cloud: {
    position: "absolute",
    height: 18,
    borderRadius: 30,
    backgroundColor: "#ffffff",
    opacity: 0.48,
  },
  hill: {
    position: "absolute",
    left: -50,
    right: 70,
    bottom: 45,
    height: 62,
    borderTopLeftRadius: 180,
    borderTopRightRadius: 220,
    backgroundColor: "#c5d3b9",
    opacity: 0.45,
    transform: [{ rotate: "9deg" }],
  },
  hillBack: {
    position: "absolute",
    left: 60,
    right: -60,
    bottom: 44,
    height: 48,
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
    backgroundColor: "#b0c4a5",
    opacity: 0.25,
  },
  plant: { position: "absolute", bottom: 52, alignSelf: "center" },
  memories: {
    position: "absolute",
    bottom: 62,
    right: 12,
    flexDirection: "row",
    opacity: 0.75,
  },
  caption: {
    position: "absolute",
    bottom: 15,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 10,
  },
  label: { fontSize: 13, lineHeight: 22, color: "#4e6953" },
  dots: { flexDirection: "row", gap: 7 },
  dot: { height: 5, width: 14, borderRadius: 4, backgroundColor: "#d0dac7" },
  filled: { backgroundColor: "#6f8965" },
});
