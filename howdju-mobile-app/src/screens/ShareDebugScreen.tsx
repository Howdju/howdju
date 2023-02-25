import React from "react";
import { Button, ScrollView, StyleSheet, View } from "react-native";
import { ShareDataItem } from "react-native-share-menu";
import { useTheme } from "react-native-paper";

import { inferSubmitUrl } from "@/services/submitUrls";
import * as webBrowser from "@/services/webBrowser";
import ShareDataItemPreview from "@/views/ShareDataItemPreview";
import { logPromiseError } from "@/util";
import Text from "@/components/Text";
import { useHowdjuUrlAuthority } from "@/hooks";

export default function ShareDebugScreen({
  items,
  extraData,
}: {
  items: ShareDataItem[];
  extraData?: Record<string, unknown>;
}) {
  const theme = useTheme();
  const authority = useHowdjuUrlAuthority();
  const submitUrl = inferSubmitUrl(authority, items);
  const hasItems = !!items && !!items.length;
  const noItemsMessage = (
    <Text
      style={[styles.centerText, styles.sectionContainer, styles.sectionTitle]}
    >
      No share items.
    </Text>
  );
  const debugInfo = (
    <>
      <Button
        title="Open Submit Page"
        onPress={() =>
          void logPromiseError(openUrl(submitUrl), `Opening URL ${submitUrl}`)
        }
        disabled={!!submitUrl}
      />
      <Section title="Share data">
        {items &&
          items.map((item, i) => (
            <Section title={item.itemGroup ?? "No item Group"} key={i}>
              <ShareDataItemPreview item={item} />
            </Section>
          ))}
      </Section>
      <Section title="Extra data">
        {extraData ? JSON.stringify(extraData) : ""}
      </Section>
    </>
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{
        backgroundColor: theme.colors.background,
      }}
    >
      {hasItems ? debugInfo : noItemsMessage}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerText: {
    textAlign: "center",
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "400",
  },
  highlight: {
    fontWeight: "700",
  },
  image: {
    width: "100%",
    height: 200,
  },
});

const Section: React.FC<{
  title: string;
}> = ({ children, title }) => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>{children}</Text>
    </View>
  );
};

async function openUrl(url: string | null) {
  if (!url) {
    console.error("openUrl must be called with a URL");
    return;
  }
  await webBrowser.openUrl(url);
}
