import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { BotanicalSticker } from "./PaperTexture";
import { Text } from "./Type";
import ActionButton from "./ActionButton";
import { useReducedMotion } from "./Motion";
import { typography, floral } from "./diary-theme";
export default function PlantMoment({
  progress,
  bloom,
  onFlower,
}: {
  progress: number;
  bloom?: { id: string; speciesId: string; color: string } | null;
  onFlower: () => void;
}) {
  const reduced = useReducedMotion(),
    value = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    value.setValue(0);
    Animated.timing(value, {
      toValue: 1,
      duration: reduced ? 200 : bloom ? 450 : 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress, bloom?.id, reduced]);
  return (
    <View style={[s.moment, bloom && s.bloom]} testID="plant-moment">
      <Animated.View
        accessibilityLabel={bloom ? "새 꽃이 피었어요" : `성장 ${progress}/4`}
        style={{
          opacity: value,
          transform: reduced
            ? []
            : [
                {
                  scale: value.interpolate({
                    inputRange: [0, 1],
                    outputRange: [bloom ? 0.85 : 0.96, 1],
                  }),
                },
              ],
        }}
      >
        <BotanicalSticker
          size={88}
          stage={bloom ? 4 : progress}
          species={bloom?.speciesId}
          color={bloom?.color || floral}
        />
      </Animated.View>
      {bloom && (
        <View style={{ flex: 1, gap: 16 }}>
          <Text style={typography.body}>
            오늘의 작은 걸음들이 모여 꽃 한 송이가 피어났어요
          </Text>
          <ActionButton title="꽃말 보러 가기" secondary onPress={onFlower} />
        </View>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  moment: { alignSelf: "flex-end" },
  bloom: {
    alignSelf: "stretch",
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
});
