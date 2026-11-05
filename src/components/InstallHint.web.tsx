import { Text, TextInput } from "./Type";
import React, { useEffect, useState } from "react";
import {} from "react-native";
export default function InstallHint() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const installed =
      matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone;
    setVisible(Boolean(ios && !installed));
  }, []);
  return visible ? (
    <Text
      style={{ fontSize: 13, lineHeight: 22, color: "#4e6953", marginTop: 8 }}
    >
      Safari에서 공유 → ‘홈 화면에 추가’를 누르면 앱처럼 열 수 있어요.
    </Text>
  ) : null;
}
