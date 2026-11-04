import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import FlowerPortrait from "./FlowerPortrait";
/** Brief native-driver bloom reveal. Never delays registration or the next action. */
export default function BloomMoment({
  species,
  color,
  reduceMotion = false,
}: {
  species: string;
  color: string;
  reduceMotion?: boolean;
}) {
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(reduceMotion ? 1 : 0.8)).current;
  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      scale.setValue(1);
      return;
    }
    opacity.setValue(0);
    scale.setValue(0.8);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 55,
        useNativeDriver: true,
      }),
    ]).start();
  }, [species, color, reduceMotion, opacity, scale]);
  return (
    <Animated.View
      accessibilityLabel="작은 꽃이 피어났어요"
      style={[s.wrapper, { opacity, transform: [{ scale }] }]}
    >
      <FlowerPortrait species={species} color={color} />
    </Animated.View>
  );
}
const s = StyleSheet.create({
  wrapper: { alignItems: "center", justifyContent: "center" },
});
