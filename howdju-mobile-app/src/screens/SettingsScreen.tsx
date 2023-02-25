import React, { useContext } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Switch, useTheme } from "react-native-paper";

import Text from "@/components/Text";
import { IsPreprodSite } from "@/contexts";

export default function SettingsScreen() {
  const theme = useTheme();
  const { isPreprodApi, setIsPreprodApi } = useContext(IsPreprodSite);
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{
        backgroundColor: theme.colors.background,
      }}
    >
      <View style={styles.row}>
        <Text>Use preprod site</Text>
        <Switch value={isPreprodApi} onValueChange={setIsPreprodApi} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
