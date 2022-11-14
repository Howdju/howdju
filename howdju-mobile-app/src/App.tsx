import React, { useCallback, useEffect, useState } from "react";

import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import ShareMenu, { ShareResponse } from "react-native-share-menu";

import BrowserScreen from "@/screens/BrowserScreen";
import ShareDebugScreen from "@/screens/ShareDebugScreen";

const Tab = createBottomTabNavigator();

const EMPTY_SHARE_RESPONSE: ShareResponse = { items: [] };

const App = (): JSX.Element => {
  const [shareResponse, setShareResponse] = useState(EMPTY_SHARE_RESPONSE);

  const handleShare = useCallback((response?: ShareResponse) => {
    if (!response) {
      return;
    }

    setShareResponse(response);
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

  const items = shareResponse?.items;
  const extraData = shareResponse?.extraData as Record<string, unknown>;

  return (
    <NavigationContainer>
      <Tab.Navigator>
        {/* TODO(#62): ensure using a render callback does not introduce
            performance issues
            https://reactnavigation.org/docs/hello-react-navigation/#passing-additional-props
        */}
        <Tab.Screen name="Browser">
          {(props) => <BrowserScreen {...props} items={items} />}
        </Tab.Screen>
        <Tab.Screen name="ShareDebug">
          {(props) => (
            <ShareDebugScreen {...props} items={items} extraData={extraData} />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App;
