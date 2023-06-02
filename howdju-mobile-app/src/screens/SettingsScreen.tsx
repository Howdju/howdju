import React, { useContext, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Menu,
  Modal,
  Portal,
  TextInput,
  useTheme,
} from "react-native-paper";

import Text from "@/components/Text";
import { HowdjuInstance, LocalInstanceAddress } from "@/contexts";
import { HowdjuInstanceName, isValidLocalInstanceAddress } from "@/hooks";

export default function SettingsScreen() {
  const theme = useTheme();
  const [isHowdjuInstanceMenuVisible, setIsHowdjuInstanceMenuVisible] =
    useState(false);
  const [
    isLocalInstanceAddressModalVisible,
    setIsLocalInstanceAddressModalVisible,
  ] = useState(false);
  const { howdjuInstance, setHowdjuInstance } = useContext(HowdjuInstance);
  const { localInstanceAddress, setLocalInstanceAddress } =
    useContext(LocalInstanceAddress);
  const [localInstanceAddressInput, setLocalInstanceAddressInput] =
    useState(localInstanceAddress);

  function onPressInstance(instance: HowdjuInstanceName) {
    return function () {
      void setHowdjuInstance(instance);
      if (instance === "LOCAL") {
        setIsLocalInstanceAddressModalVisible(true);
      }
      setIsHowdjuInstanceMenuVisible(false);
    };
  }

  function onSaveLocalInstanceAddressModal() {
    setIsLocalInstanceAddressModalVisible(false);
    // Don't set the local address until the user closes the modal so that
    // the webview doens't navigate to the new address before the user is
    // ready.
    const localAddress = hasScheme(localInstanceAddressInput)
      ? localInstanceAddressInput
      : `http://${localInstanceAddressInput}`;
    void setLocalInstanceAddress(localAddress);
  }

  function dismissLocalInstanceAddressModel() {
    setIsLocalInstanceAddressModalVisible(false);
  }

  const isValidLocalInstanceAddressInput = isValidLocalInstanceAddress(
    localInstanceAddressInput
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{
        backgroundColor: theme.colors.background,
      }}
    >
      <Portal>
        <Modal
          visible={isLocalInstanceAddressModalVisible}
          onDismiss={dismissLocalInstanceAddressModel}
        >
          <TextInput
            placeholder="Local instance address"
            keyboardType="url"
            value={localInstanceAddressInput}
            onChangeText={setLocalInstanceAddressInput}
            error={!isValidLocalInstanceAddressInput}
          />
          <Button
            disabled={!isValidLocalInstanceAddressInput}
            onPress={onSaveLocalInstanceAddressModal}
          >
            Save
          </Button>
          <Button
            disabled={!isValidLocalInstanceAddressInput}
            onPress={dismissLocalInstanceAddressModel}
          >
            Cancel
          </Button>
        </Modal>
      </Portal>
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
          <Menu.Item onPress={onPressInstance("PROD")} title="PROD" />
          <Menu.Item onPress={onPressInstance("PREPROD")} title="PREPROD" />
          <Menu.Item onPress={onPressInstance("LOCAL")} title="LOCAL…" />
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

function hasScheme(address: string) {
  return address.indexOf("://") > -1;
}
