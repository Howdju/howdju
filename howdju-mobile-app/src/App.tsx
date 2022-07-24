/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, {useCallback, useEffect, useState} from 'react';
import { WebView } from 'react-native-webview';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import {
  Colors,
  Header,
} from 'react-native/Libraries/NewAppScreen';
import ShareMenu from 'react-native-share-menu';
import ShareDataItemPreview from './ShareDataItemPreview';

type ShareResponse = {
  data: ShareData,
  extraData: object | null,
};
type ShareData = {
  items: ShareDataItem[]
};
type ShareDataItem = {
  value: any,
  mimeType: string,
  itemGroup: string,
};

const Section: React.FC<{
  title: string;
}> = ({children, title}) => {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
};

const EMPTY_SHARE_DATA: ShareData = {items:[]}

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const [shareData, setShareData] = useState(EMPTY_SHARE_DATA);
  const [extraData, setExtraData] = useState(null);

  const handleShare = useCallback((response: ShareResponse | null) => {
    if (!response) {
      return;
    }

    const {data, extraData} = response;

    setShareData(data);
    setExtraData(extraData);
  }, []);

  useEffect(() => {
    ShareMenu.getInitialShare(handleShare);
  }, [handleShare]);

  useEffect(() => {
    const listener = ShareMenu.addNewShareListener(handleShare);
    return () => {
      listener.remove();
    };
  }, [handleShare]);

  console.log('App', {shareData})
  const items = shareData?.items;

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <Header />
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
            
          <Section title="Share data">
            {items && items.map((item, i) => (
              <Section title={item.itemGroup} key={i}>
                <ShareDataItemPreview item={item} />
              </Section>
            ))}
          </Section>
          <Section title="Extra data">
            {extraData ? JSON.stringify(extraData) : ''}
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
});

export default App;
