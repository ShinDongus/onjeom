import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BotanicalSticker } from "./PaperTexture";
import { diary, ink, line, muted, sage } from "./diary-theme";
import { recordDay } from "../diary.mjs";
const seasonNames: Record<string, string> = {
  christmas: "크리스마스",
  halloween: "할로윈",
  newyear: "새해",
  chuseok: "추석",
};
export default function CatalogScreen({
  species,
  flowers,
  onFlower,
  onGarden,
}: {
  species: any[];
  flowers: any[];
  onFlower: (id: string) => void;
  onGarden: () => void;
}) {
  const [index, setIndex] = useState(0),
    [selected, setSelected] = useState<string | null>(null);
  const plant = species[index],
    found = flowers.filter((f) => f.registeredAt && f.speciesId === plant.id),
    flower = found.find((f) => f.id === selected) || found[0];
  return (
    <View style={diary.page} testID="botanical-book">
      <View>
        <Text style={diary.eyebrow}>꽃이 남긴 문장</Text>
        <Text accessibilityRole="header" style={diary.title}>
          나의 식물도감
        </Text>
      </View>
      <View style={s.specimen}>
        <View style={s.tape} />
        <Text style={s.number}>
          SPECIMEN {String(index + 1).padStart(2, "0")}
        </Text>
        <View style={!flower && { opacity: 0.25 }}>
          <BotanicalSticker
            species={plant.id}
            color={flower?.color || "#bdc7ae"}
            size={148}
            stage={flower ? 4 : 2}
          />
        </View>
        <Text accessibilityRole="header" style={s.name}>
          {flower ? plant.name : "아직 만나지 않은 꽃"}
        </Text>
        <Text style={s.latin}>
          {flower
            ? `${flower.variantName} · ${recordDay(flower.createdAt)}`
            : "작은 행동 끝에, 이 페이지가 채워져요."}
        </Text>
      </View>
      {flower ? (
        <>
          <View style={s.quote}>
            <Text style={s.quoteText}>“{flower.quote}”</Text>
            <Text style={s.source}>꽃말 · 온점.의 창작 문구</Text>
          </View>
          <View style={s.facts}>
            <Text style={diary.small}>
              색상 {flower.variantName}
              {flower.variantId !== "normal" ? " · 희귀 색상" : ""}
            </Text>
            <Text style={diary.small}>
              시즌{" "}
              {flower.seasonId
                ? seasonNames[flower.seasonId] || "시즌 꽃"
                : "계절에 관계없이"}
            </Text>
          </View>
          {found.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            >
              {found.map((f) => (
                <Pressable
                  key={f.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${f.variantName} ${recordDay(f.createdAt)} 도감 기록`}
                  onPress={() => setSelected(f.id)}
                  style={s.variant}
                >
                  <View style={[s.swatch, { backgroundColor: f.color }]} />
                  <Text style={diary.small}>
                    {f.variantName} · {recordDay(f.createdAt)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() => onFlower(flower.id)}
            style={diary.quiet}
          >
            <Text style={s.link}>꽃 기록과 무료 카드 펼치기 ↗</Text>
          </Pressable>
        </>
      ) : (
        <View style={s.empty}>
          <Text style={diary.small}>
            꽃은 정원에 계속 머물러요.{"\n"}마음이 닿을 때 도감에 담아보세요.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onGarden}
            style={diary.quiet}
          >
            <Text style={s.link}>정원에서 꽃 살펴보기 ↗</Text>
          </Pressable>
        </View>
      )}
      <View style={s.pager}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="이전 도감 페이지"
          disabled={index === 0}
          accessibilityState={{ disabled: index === 0 }}
          onPress={() => {
            setIndex(index - 1);
            setSelected(null);
          }}
          style={[diary.quiet, index === 0 && { opacity: 0.25 }]}
        >
          <Text style={s.arrow}>‹</Text>
        </Pressable>
        <Text style={diary.small}>
          {index + 1} / {species.length}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="다음 도감 페이지"
          disabled={index === species.length - 1}
          accessibilityState={{ disabled: index === species.length - 1 }}
          onPress={() => {
            setIndex(index + 1);
            setSelected(null);
          }}
          style={[
            diary.quiet,
            index === species.length - 1 && { opacity: 0.25 },
          ]}
        >
          <Text style={s.arrow}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  specimen: {
    alignItems: "center",
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: line,
    position: "relative",
  },
  number: {
    fontSize: 9,
    color: "#939b83",
    letterSpacing: 2,
    alignSelf: "flex-start",
  },
  tape: {
    position: "absolute",
    top: 12,
    right: 28,
    width: 56,
    height: 17,
    backgroundColor: "#ded9b8",
    opacity: 0.45,
    transform: [{ rotate: "-12deg" }],
  },
  name: {
    fontSize: 24,
    lineHeight: 36,
    color: ink,
    fontWeight: "500",
    marginTop: 4,
  },
  latin: {
    fontSize: 11,
    lineHeight: 20,
    color: muted,
    marginTop: 4,
    textAlign: "center",
  },
  quote: { alignItems: "center", gap: 9 },
  quoteText: { color: sage, fontSize: 19, lineHeight: 30, textAlign: "center" },
  source: { fontSize: 10, color: muted },
  facts: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  link: { color: sage, fontSize: 13 },
  empty: { alignItems: "center", gap: 6 },
  pager: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: line,
    paddingTop: 4,
  },
  arrow: { fontSize: 28, color: sage },
  variant: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
  },
  swatch: { height: 10, width: 10, borderRadius: 5 },
});
