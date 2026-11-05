import React, {
  forwardRef,
  useRef,
  useEffect,
  useImperativeHandle,
  useContext,
} from "react";
import {
  Text as NativeText,
  TextInput as NativeInput,
  TextProps,
  TextInputProps,
  StyleSheet,
  Platform,
  findNodeHandle,
} from "react-native";
import { SheetScrollContext } from "./SheetContext";
import { fonts, typography, ink } from "./diary-theme";
function family(style: any) {
  const flat = StyleSheet.flatten(style) || {};
  return (
    flat.fontFamily ||
    (Number(flat.fontWeight) >= 600
      ? fonts.sans600
      : Number(flat.fontWeight) >= 500
        ? fonts.sans500
        : fonts.sans400)
  );
}
export function Text({ style, ...props }: TextProps) {
  return (
    <NativeText
      allowFontScaling
      maxFontSizeMultiplier={1.35}
      {...props}
      style={[
        typography.body,
        style,
        { fontFamily: family(style), fontWeight: "normal" },
      ]}
    />
  );
}
export const TextInput = forwardRef<NativeInput, TextInputProps>(
  function TextInput({ style, onFocus, ...props }, ref) {
    const input = useRef<NativeInput>(null),
      scroll = useContext(SheetScrollContext),
      pending = useRef<ReturnType<typeof setTimeout> | null>(null);
    useImperativeHandle(ref, () => input.current!);
    useEffect(
      () => () => {
        if (pending.current) clearTimeout(pending.current);
      },
      [],
    );
    return (
      <NativeInput
        ref={input}
        onFocus={(e) => {
          onFocus?.(e);
          if (pending.current) clearTimeout(pending.current);
          pending.current = setTimeout(() => {
            if (!input.current) return;
            if (Platform.OS === "web") {
              (input.current as any).scrollIntoView?.({ block: "nearest" });
            } else if (scroll?.current) {
              scroll.current.scrollResponderScrollNativeHandleToKeyboard?.(
                findNodeHandle(input.current),
                24,
                true,
              );
            }
          }, 250);
        }}
        allowFontScaling
        maxFontSizeMultiplier={1.35}
        {...props}
        style={[
          typography.body,
          style,
          { fontFamily: family(style), fontWeight: "normal" },
          Platform.OS === "web" &&
            ({ outlineStyle: "none", caretColor: ink } as any),
        ]}
      />
    );
  },
);
