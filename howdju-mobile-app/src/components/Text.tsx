import React from "react";
import { StyleSheet, Text as RNText, TextProps } from "react-native";
import { useTheme } from "react-native-paper";

export default function Text({ style, ...rest }: TextProps) {
  const theme = useTheme();
  const composedStyle = StyleSheet.compose(style, {
    color: theme.colors.secondary,
  });
  return <RNText {...rest} style={composedStyle} />;
}
