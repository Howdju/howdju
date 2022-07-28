import React, {useCallback, useEffect, useState} from 'react';

import {
  StyleSheet,
  useColorScheme,
} from 'react-native';

import {
  Colors,
} from 'react-native/Libraries/NewAppScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ShareMenu from 'react-native-share-menu';

import BrowserScreen from 'screens/BrowserScreen';
import ShareDebugScreen from 'screens/ShareDebugScreen';
import ShareData from 'models/ShareData';

type ShareResponse = {
  data: ShareData,
  extraData: object | null,
};

const Tab = createBottomTabNavigator();

const EMPTY_SHARE_DATA: ShareData = {items:[]}

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const [shareData, setShareData] = useState(EMPTY_SHARE_DATA);
  const [extraData, setExtraData] = useState(null as object | null);

  const handleShare = useCallback((response: ShareResponse) => {
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
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Browser">
          {(props) => <BrowserScreen {...props} items={items}/>}
        </Tab.Screen>
        <Tab.Screen name="ShareDebug">
          {(props) => <ShareDebugScreen {...props} items={items} extraData={extraData}/>}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
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
