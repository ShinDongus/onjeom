import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import FlowerArt from "./FlowerArt";
export type GardenItem = {
  id: string;
  name: string;
  speciesId: string;
  color: string;
  note?: string;
  flowerId?: string;
};
type Props = {
  items: GardenItem[];
  onSelect: (id: string) => void;
  label?: string;
};
export default function GardenPager({
  items,
  onSelect,
  label = "정원",
}: Props) {
  const screen = useWindowDimensions();
  const [width, setWidth] = useState(Math.min(screen.width, 480) - 40),
    [page, setPage] = useState(0);
  const list = useRef<FlatList<number>>(null),
    pageRef = useRef(0);
  pageRef.current = page;
  const count = Math.max(1, Math.ceil(items.length / 9));
  const pages = useMemo(
    () => Array.from({ length: count }, (_, i) => i),
    [count],
  );
  const art = Math.min(60, Math.max(38, ((width - 40) / 3) * 0.62));
  const cellHeight = Math.ceil((art * 215) / 160 + 34),
    height = cellHeight * 3 + 40;
  const go = (next: number) => {
    const target = Math.max(0, Math.min(count - 1, next));
    setPage(target);
    list.current?.scrollToOffset({ offset: target * width, animated: false });
  };
  useEffect(() => {
    if (page >= count) go(count - 1);
  }, [count, page]);
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      list.current?.scrollToOffset({
        offset: pageRef.current * width,
        animated: false,
      }),
    );
    return () => cancelAnimationFrame(id);
  }, [width]);
  return (
    <View style={s.container}>
      <View
        style={s.frame}
        onLayout={(e) => {
          if (e.nativeEvent.layout.width > 0)
            setWidth(e.nativeEvent.layout.width);
        }}
      >
        <FlatList
          testID="garden-pager"
          ref={list}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={pages}
          extraData={items}
          keyExtractor={(i) => String(i)}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          style={{ height }}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          onScroll={(e) =>
            setPage(
              Math.max(
                0,
                Math.min(
                  count - 1,
                  Math.round(e.nativeEvent.contentOffset.x / width),
                ),
              ),
            )
          }
          scrollEventThrottle={64}
          renderItem={({ item: sheet }) => (
            <View
              testID={`garden-page-${sheet}`}
              accessibilityLabel={`${label} ${sheet + 1}페이지`}
              style={{ width, padding: 12, gap: 8 }}
            >
              {[0, 1, 2].map((row) => (
                <View key={row} style={s.row}>
                  {[0, 1, 2].map((col) => {
                    const index = sheet * 9 + row * 3 + col;
                    const item = items[index];
                    return item ? (
                      <Pressable
                        testID="garden-flower"
                        key={col}
                        accessibilityRole="button"
                        accessibilityLabel={`${item.name}, ${item.note || "꽃 상세 보기"}`}
                        onPress={() => onSelect(item.id)}
                        style={({ pressed }) => [
                          s.cell,
                          { height: cellHeight, opacity: pressed ? 0.65 : 1 },
                        ]}
                      >
                        <FlowerArt
                          species={item.speciesId}
                          color={item.color}
                          stage={item.flowerId ? 4 : 0}
                          size={art}
                        />
                        <Text numberOfLines={1} style={s.name}>
                          {item.name}
                        </Text>
                        <Text numberOfLines={1} style={s.note}>
                          {item.note || " "}
                        </Text>
                      </Pressable>
                    ) : (
                      <View
                        testID="garden-empty"
                        key={col}
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                        style={[s.cell, s.empty, { height: cellHeight }]}
                      >
                        <FlowerArt stage={0} size={art * 0.65} />
                        <Text style={s.emptyText}>기다리는 자리</Text>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        />
      </View>
      <View style={s.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="이전 정원 페이지"
          disabled={page === 0}
          accessibilityState={{ disabled: page === 0 }}
          onPress={() => go(page - 1)}
          style={[s.arrow, page === 0 && s.disabled]}
        >
          <Text style={s.arrowText}>‹</Text>
        </Pressable>
        <View style={s.center}>
          <Text accessibilityLiveRegion="polite" style={s.page}>
            {page + 1} / {count}
          </Text>
          <Text style={s.hint}>옆으로 넘겨보세요</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="다음 정원 페이지"
          disabled={page === count - 1}
          accessibilityState={{ disabled: page === count - 1 }}
          onPress={() => go(page + 1)}
          style={[s.arrow, page === count - 1 && s.disabled]}
        >
          <Text style={s.arrowText}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  container: { gap: 12 },
  frame: {
    width: "100%",
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#eaf0e2",
  },
  row: { flexDirection: "row", gap: 8 },
  cell: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#f9faf3",
    paddingHorizontal: 3,
  },
  name: {
    fontSize: 12,
    lineHeight: 17,
    color: "#344c3b",
    alignSelf: "stretch",
    textAlign: "center",
  },
  note: { fontSize: 10, lineHeight: 15, color: "#81917a" },
  empty: { backgroundColor: "rgba(249,250,243,.35)", opacity: 0.55 },
  emptyText: { fontSize: 10, color: "#899780", marginTop: 12 },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 22,
  },
  arrow: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eeeade",
    borderRadius: 22,
  },
  arrowText: { fontSize: 29, color: "#49674e", lineHeight: 32 },
  disabled: { opacity: 0.3 },
  center: { alignItems: "center", gap: 4 },
  page: { fontSize: 14, color: "#344c3b", fontWeight: "600" },
  hint: { fontSize: 11, color: "#81917a" },
});
