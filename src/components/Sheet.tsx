import React from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  opacity?: Animated.Value | number;
};
export default function Sheet({
  visible,
  onClose,
  children,
  opacity = 1,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.overlay}
      >
        <Animated.View accessibilityViewIsModal style={[s.panel, { opacity }]}>
          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.content}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(40,62,52,.38)",
    padding: 24,
  },
  panel: {
    width: "100%",
    maxWidth: 600,
    maxHeight: "92%",
    alignSelf: "center",
    flexShrink: 1,
  },
  scroll: { borderRadius: 28, backgroundColor: "#fbf8ef", flexGrow: 0 },
  content: { padding: 24, gap: 12 },
});
