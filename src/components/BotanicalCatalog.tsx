import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import FlowerArt from "./FlowerArt";
type Item = {
  id: string;
  name: string;
  speciesId: string;
  color: string;
  foundId?: string;
  count: number;
};
export default function BotanicalCatalog({
  items,
  onFlower,
  onUnknown,
}: {
  items: Item[];
  onFlower: (id: string) => void;
  onUnknown: () => void;
}) {
  return (
    <View style={s.book}>
      <View style={s.heading}>
        <Text style={s.eyebrow}>BOTANICAL MEMORIES</Text>
        <Text style={s.title}>나만의 꽃 도감</Text>
        <Text style={s.note}>피워낸 꽃과 그날의 이야기를 오래 간직해요.</Text>
      </View>
      <View style={s.entries}>
        {items.map((f, i) => (
          <Pressable
            key={f.id}
            onPress={() => (f.foundId ? onFlower(f.foundId) : onUnknown())}
            accessibilityRole="button"
            accessibilityLabel={
              f.foundId ? f.name + " 자세히 보기" : "미발견 꽃"
            }
            style={s.entry}
          >
            <View style={s.num}>
              <Text style={s.numText}>{String(i + 1).padStart(2, "0")}</Text>
            </View>
            <View style={s.picture}>
              {f.foundId ? (
                <FlowerArt
                  species={f.speciesId}
                  color={f.color}
                  stage={4}
                  size={86}
                />
              ) : (
                <Text style={s.unknown}>✽</Text>
              )}
            </View>
            <Text style={[s.flowerName, !f.foundId && s.dim]}>
              {f.foundId ? f.name : "아직 만나지 못한 꽃"}
            </Text>
            <Text style={s.meta}>
              {f.foundId ? f.count + "가지 색상 발견" : "한 걸음씩 채워가요"}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.footer}>꽃말은 온점.이 직접 만든 창작 문구입니다.</Text>
    </View>
  );
}
const s = StyleSheet.create({
  book: {
    backgroundColor: "#FFFCF5",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E6E0D5",
    padding: 16,
    gap: 18,
  },
  heading: {
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E7E1D4",
    paddingBottom: 12,
  },
  eyebrow: { fontSize: 10, color: "#A69A80", letterSpacing: 1.2 },
  title: { fontSize: 22, color: "#385241", fontWeight: "700" },
  note: { fontSize: 12, color: "#869780" },
  entries: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  entry: {
    width: "48%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBE0",
    paddingBottom: 15,
    gap: 5,
    minHeight: 174,
  },
  num: { alignSelf: "flex-start" },
  numText: { fontSize: 11, color: "#B4A58E" },
  picture: { height: 92, justifyContent: "center", alignItems: "center" },
  unknown: { fontSize: 45, color: "#D6DCCE" },
  flowerName: {
    fontSize: 13,
    color: "#415D46",
    fontWeight: "600",
    textAlign: "center",
  },
  dim: { color: "#9AA897" },
  meta: { fontSize: 10, color: "#8A9A88" },
  footer: { fontSize: 10, color: "#96A18E", textAlign: "center" },
});
