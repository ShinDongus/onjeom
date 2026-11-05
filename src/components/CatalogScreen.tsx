import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import AppIcon from "./AppIcon";
import { Text } from "./Type";
import { BotanicalSticker } from "./PaperTexture";
import { diary, typography, ink, muted, line, sand } from "./diary-theme";
import { recordDay } from "../diary.mjs";
const seasons: Record<string, string> = {
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
    [selected, setSelected] = useState<string | null>(null),
    plant = species[index];
  const owned = flowers.filter((f) => f.speciesId === plant.id),
    found = owned.filter((f) => f.registeredAt),
    flower = found.find((f) => f.id === selected) || found[0],
    first = [...owned].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    )[0];
  const colors = [
    ...new Map(owned.map((f) => [f.variantId, f])).values(),
  ] as any[];
  return (
    <View style={diary.page} testID="botanical-book">
      <View style={s.specimen}>
        <View style={!flower && { opacity: 0.25 }}>
          <BotanicalSticker
            species={plant.id}
            color={flower?.color}
            size={148}
            stage={flower ? 4 : 1}
          />
        </View>
        <Text accessibilityRole="header" style={typography.date}>
          {flower ? plant.name : "아직 만나지 않은 꽃"}
        </Text>
      </View>
      {flower ? (
        <>
          <Text style={[typography.body, { textAlign: "center" }]}>
            “{flower.quote}”
          </Text>
          <Text style={[typography.caption, { textAlign: "center" }]}>
            창작 꽃말 · 온점.
          </Text>
          <View style={diary.section}>
            <Text style={typography.caption}>
              최초 개화일 {recordDay(first.createdAt)}
            </Text>
            <Text style={typography.caption}>
              시즌{" "}
              {flower.seasonId
                ? seasons[flower.seasonId] || "시즌 꽃"
                : "계절에 관계없이"}
            </Text>
            <Text style={typography.caption}>보유 색상</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 16 }}
            >
              {colors.map((f) => (
                <Pressable
                  key={f.variantId}
                  accessibilityRole="button"
                  accessibilityLabel={`${f.variantName} 색상 기록`}
                  onPress={() => {
                    if (f.registeredAt) setSelected(f.id);
                    else onFlower(f.id);
                  }}
                  style={s.badge}
                >
                  <View style={[s.swatch, { backgroundColor: f.color }]} />
                  <Text style={typography.caption}>
                    {f.variantName}
                    {f.variantId !== "normal" ? " · 희귀 색상" : ""}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={typography.heading}>이 꽃과 함께 남긴 작은 행동</Text>
            <Text style={typography.body}>
              {(flower.achievements?.length
                ? flower.achievements
                : [flower.originTask]
              ).join("\n")}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => onFlower(flower.id)}
              style={diary.quiet}
            >
              <Text style={typography.action}>꽃 기록과 무료 카드 펼치기</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View style={{ gap: 16 }}>
          <Text style={typography.body}>
            작은 행동 끝에, 이 페이지가 채워져요.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onGarden}
            style={diary.quiet}
          >
            <Text style={typography.action}>정원에서 꽃 살펴보기</Text>
          </Pressable>
        </View>
      )}
      <View style={s.pager}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="이전 도감 페이지"
          disabled={index === 0}
          onPress={() => {
            setIndex(index - 1);
            setSelected(null);
          }}
          style={diary.quiet}
        >
          <AppIcon name="이전" color={ink} />
        </Pressable>
        <Text style={typography.caption}>
          {index + 1} / {species.length}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="다음 도감 페이지"
          disabled={index === species.length - 1}
          onPress={() => {
            setIndex(index + 1);
            setSelected(null);
          }}
          style={diary.quiet}
        >
          <AppIcon name="다음" color={ink} />
        </Pressable>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  specimen: { alignItems: "center", gap: 32 },
  pager: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: line,
    paddingTop: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: sand,
  },
  swatch: { width: 12, height: 12, borderRadius: 6 },
});
