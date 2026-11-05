import React, { useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import AppIcon from "./AppIcon";
import { Text, TextInput } from "./Type";
import { diary, typography, ink, line, muted } from "./diary-theme";
function Row({
  index,
  text,
  onChange,
  onRemove,
  onMove,
  count,
  onLayout,
}: {
  index: number;
  text: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  onMove: (offset: number) => void;
  count: number;
  onLayout: (y: number, height: number) => void;
}) {
  const y = useRef(new Animated.Value(0)).current,
    start = useRef({ index, count, onMove }),
    [dragging, setDragging] = useState(false);
  start.current = { index, count, onMove };
  const height = useRef(100);
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 3,
      onPanResponderGrant: () => setDragging(true),
      onPanResponderMove: (_, g) => y.setValue(g.dy),
      onPanResponderRelease: (_, g) => {
        const offset = Math.round(g.dy / height.current);
        start.current.onMove(offset);
        y.setValue(0);
        setDragging(false);
      },
      onPanResponderTerminate: () => {
        y.setValue(0);
        setDragging(false);
      },
    }),
  ).current;
  return (
    <Animated.View
      testID={`review-row-${index}`}
      onLayout={(e) => {
        height.current = e.nativeEvent.layout.height;
        onLayout(e.nativeEvent.layout.y, height.current);
      }}
      style={[
        s.row,
        { transform: [{ translateY: y }], zIndex: dragging ? 5 : 0 },
      ]}
    >
      <View style={s.header}>
        <Text style={typography.caption}>
          {String(index + 1).padStart(2, "0")}
        </Text>
        <View style={{ flexDirection: "row" }}>
          <View
            {...pan.panHandlers}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`할 일 ${index + 1} 드래그 순서 변경`}
            accessibilityActions={[
              { name: "increment", label: "아래로" },
              { name: "decrement", label: "위로" },
            ]}
            onAccessibilityAction={(e) =>
              onMove(e.nativeEvent.actionName === "increment" ? 1 : -1)
            }
            {...({
              tabIndex: 0,
              onKeyDown: (e: any) => {
                if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                  e.preventDefault();
                  onMove(e.key === "ArrowUp" ? -1 : 1);
                }
              },
            } as any)}
            style={s.handle}
          >
            <AppIcon name="순서" color={ink} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`할 일 ${index + 1} 제외`}
            onPress={onRemove}
            style={diary.quiet}
          >
            <Text style={typography.action}>제외</Text>
          </Pressable>
        </View>
      </View>
      <TextInput
        accessibilityLabel={`할 일 ${index + 1} 수정`}
        multiline
        value={text}
        onChangeText={onChange}
        maxLength={500}
        placeholder="작은 행동을 적어주세요"
        placeholderTextColor={muted}
        style={s.input}
      />
    </Animated.View>
  );
}
export default function ReviewList({
  items,
  onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const move = (index: number, offset: number) => {
    const target = Math.min(items.length - 1, Math.max(0, index + offset));
    if (target === index) return;
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  };
  return (
    <View style={{ gap: 32 }}>
      {items.map((text, i) => (
        <Row
          key={i}
          index={i}
          text={text}
          count={items.length}
          onLayout={() => {}}
          onChange={(value) =>
            onChange(items.map((x, j) => (j === i ? value : x)))
          }
          onRemove={() => onChange(items.filter((_, j) => j !== i))}
          onMove={(offset) => move(i, offset)}
        />
      ))}
    </View>
  );
}
const s = StyleSheet.create({
  row: {
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: line,
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  handle: {
    height: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    ...typography.body,
    color: ink,
    padding: 0,
    minHeight: 56,
    backgroundColor: "transparent",
  },
});
