import React from 'react'
import {Button, ScrollView, StyleSheet, Text, useColorScheme, View} from 'react-native'
import {Colors} from 'react-native/Libraries/NewAppScreen'
import {ShareDataItem} from 'react-native-share-menu'

import {inferSubmitUrl} from '@/services/submitUrls'
import * as webBrowser from '@/services/webBrowser'
import ShareDataItemPreview from '@/views/ShareDataItemPreview'

const Section: React.FC<{
  title: string
}> = ({children, title}) => {
  const isDarkMode = useColorScheme() === 'dark'
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  }
  return (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, backgroundStyle]}>{title}</Text>
      <Text style={[styles.sectionDescription, backgroundStyle]}>{children}</Text>
    </View>
  )
}

async function openUrl(url: string | null) {
  if (!url) {
    console.error('openUrl must be called with a URL')
    return
  }
  await webBrowser.openUrl(url)
}

const ShareDebugScreen: React.FC<{
  items: ShareDataItem[]
  extraData?: object
}> = ({items, extraData}) => {
  const isDarkMode = useColorScheme() === 'dark'

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  }

  const submitUrl = inferSubmitUrl(items)

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={backgroundStyle}>
      <View
        style={{
          backgroundColor: isDarkMode ? Colors.black : Colors.white,
        }}
      >
        <Button
          title="Open Submit Page"
          onPress={async () => openUrl(submitUrl)}
          disabled={!!submitUrl}
        />
        <Section title="Share data">
          {items &&
            items.map((item, i) => (
              <Section title={item.itemGroup ?? 'No item Group'} key={i}>
                <ShareDataItemPreview item={item} />
              </Section>
            ))}
        </Section>
        <Section title="Extra data">{extraData ? JSON.stringify(extraData) : ''}</Section>
      </View>
    </ScrollView>
  )
}

export default ShareDebugScreen

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  image: {
    width: '100%',
    height: 200,
  },
})
