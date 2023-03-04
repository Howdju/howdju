import React, { useContext, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Menu, useTheme } from "react-native-paper";

import Text from "@/components/Text";
import { HowdjuInstance } from "@/contexts";
import { HowdjuInstanceName } from "@/hooks";

export default function SettingsScreen() {
  const theme = useTheme();
  const [isHowdjuInstanceMenuVisible, setIsHowdjuInstanceMenuVisible] =
    useState(false);
  const { howdjuInstance, setHowdjuInstance } = useContext(HowdjuInstance);

  function onPressInstance(instance: HowdjuInstanceName) {
    return async function () {
      await setHowdjuInstance(instance);
      setIsHowdjuInstanceMenuVisible(false);
    };
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{
        backgroundColor: theme.colors.background,
      }}
    >
      <View style={styles.row}>
        <Text>Howdju instance</Text>
        <Menu
          visible={isHowdjuInstanceMenuVisible}
          onDismiss={() => setIsHowdjuInstanceMenuVisible(false)}
          anchor={
            <Button onPress={() => setIsHowdjuInstanceMenuVisible(true)}>
              {howdjuInstance}
            </Button>
          }
        >
          <Menu.Item onPress={void onPressInstance("PROD")} title="Prod" />
          <Menu.Item
            onPress={void onPressInstance("PREPROD")}
            title="Preprod"
          />
          <Menu.Item onPress={void onPressInstance("LOCAL")} title="Local" />
        </Menu>
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
