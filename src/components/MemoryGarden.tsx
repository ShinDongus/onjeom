import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import FlowerArt from "./FlowerArt";
type Flower = {
  id: string;
  speciesId: string;
  color: string;
  name: string;
  registeredAt?: string | null;
};
const SCENES: any = {
  봄: { sky: "#F2F0DE", hill: "#E1E6D6", grass: "#C6D9BD", accent: "#F6E4BC" },
  여름: {
    sky: "#E5EEDC",
    hill: "#C7DBC5",
    grass: "#ADCFA9",
    accent: "#F6E1A3",
  },
  가을: {
    sky: "#F2E8D5",
    hill: "#E5D6B5",
    grass: "#C9CFA7",
    accent: "#E9BD89",
  },
  겨울: {
    sky: "#EEEFEA",
    hill: "#E1E9E5",
    grass: "#CFDED5",
    accent: "#F6F1D9",
  },
};
export default function MemoryGarden({
  flowers,
  progress,
  season,
  onSelect,
}: {
  flowers: Flower[];
  progress: number;
  season: string;
  onSelect: (id: string) => void;
}) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(flowers.length / 12));
  const index = Math.min(page, pages - 1);
  const items = flowers.slice(index * 12, (index + 1) * 12);
  const scene = SCENES[season] || SCENES.봄;
  return (
    <View style={s.wrapper}>
      <View style={[s.scene, { backgroundColor: scene.sky }]}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 360 430"
          preserveAspectRatio="none"
          style={StyleSheet.absoluteFill}
        >
          <Circle cx="297" cy="66" r="28" fill={scene.accent} opacity=".68" />
          <Path
            d="M0 220C75 158 160 225 225 186S324 175 360 204V430H0Z"
            fill={scene.hill}
          />
          <Path
            d="M0 280C84 230 132 299 202 263S302 246 360 275V430H0Z"
            fill={scene.grass}
          />
          <Ellipse
            cx="176"
            cy="410"
            rx="169"
            ry="22"
            fill="#7F9E7C"
            opacity=".14"
          />
        </Svg>
        {items.length === 0 ? (
          <View style={s.empty}>
            <FlowerArt
              stage={Math.min(progress, 3)}
              size={148}
              color="#D3A69F"
            />
            <Text style={s.emptyTitle}>아직 첫 꽃을 기다리고 있어요.</Text>
            <Text style={s.emptyHint}>
              한 걸음마다 작은 생명이 자라고 있어요.
            </Text>
          </View>
        ) : (
          <View style={s.flowers}>
            {items.map((f, i) => (
              <Pressable
                key={f.id}
                accessibilityRole="button"
                accessibilityLabel={f.name + " 꽃말 보기"}
                onPress={() => onSelect(f.id)}
                style={[
                  s.plant,
                  {
                    left: `${5 + (i % 3) * 31}%` as `${number}%`,
                    top: `${7 + Math.floor(i / 3) * 22}%` as `${number}%`,
                  },
                ]}
              >
                <FlowerArt
                  species={f.speciesId}
                  color={f.color}
                  stage={4}
                  size={74}
                />
                <Text style={s.plantLabel} numberOfLines={1}>
                  {f.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
      <View style={s.bottom}>
        <View style={s.caption}>
          <Text style={s.captionTitle}>기억의 정원</Text>
          <Text style={s.captionText}>
            피어난 꽃 {flowers.length}송이 · {season}
          </Text>
        </View>
        {pages > 1 && (
          <View style={s.pager}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="이전 정원"
              disabled={index === 0}
              onPress={() => setPage(index - 1)}
              style={s.arrow}
            >
              <Text style={s.arrowText}>‹</Text>
            </Pressable>
            <Text style={s.page}>
              {index + 1}/{pages}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="다음 정원"
              disabled={index === pages - 1}
              onPress={() => setPage(index + 1)}
              style={s.arrow}
            >
              <Text style={s.arrowText}>›</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  wrapper: { gap: 10 },
  scene: {
    height: 425,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E4E6D7",
    position: "relative",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    color: "#48664E",
    fontWeight: "600",
    marginTop: 4,
  },
  emptyHint: { fontSize: 12, color: "#819580" },
  flowers: { ...StyleSheet.absoluteFillObject },
  plant: {
    position: "absolute",
    width: "30%",
    height: "23%",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 0,
  },
  plantLabel: {
    fontSize: 10,
    color: "#526D56",
    maxWidth: 95,
    textAlign: "center",
  },
  bottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  caption: { gap: 4 },
  captionTitle: { fontSize: 14, fontWeight: "600", color: "#415E46" },
  captionText: { fontSize: 12, color: "#839580" },
  pager: { flexDirection: "row", alignItems: "center", gap: 5 },
  arrow: {
    minWidth: 40,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: { fontSize: 24, color: "#607B62" },
  page: { fontSize: 12, color: "#6E846F" },
});
