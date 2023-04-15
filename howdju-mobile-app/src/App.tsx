import React, { useCallback, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import ShareMenu, { ShareResponse } from "react-native-share-menu";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {
  adaptNavigationTheme,
  Provider as PaperProvider,
} from "react-native-paper";

import BrowserScreen from "@/screens/BrowserScreen";
import ShareDebugScreen from "@/screens/ShareDebugScreen";
import SettingsScreen from "./screens/SettingsScreen";
import { darkTheme, lightTheme } from "./themes";
import AppSettings from "./AppSettings";
import { SafeAreaProvider } from "react-native-safe-area-context";

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
  const isDark = useColorScheme() === "dark";
  const theme = isDark ? darkTheme : lightTheme;

  const { LightTheme: lightNavigationTheme, DarkTheme: darkNavigationTheme } =
    adaptNavigationTheme({
      reactNavigationLight: DefaultTheme,
      reactNavigationDark: DefaultTheme,
      materialLight: lightTheme,
      materialDark: darkTheme,
    });

  return (
    <PaperProvider theme={theme}>
      <AppSettings>
        <SafeAreaProvider>
          <NavigationContainer
            theme={isDark ? darkNavigationTheme : lightNavigationTheme}
          >
            <Tab.Navigator>
              {/* TODO(62): ensure using a render callback does not introduce
            performance issues
            https://reactnavigation.org/docs/hello-react-navigation/#passing-additional-props
        */}
              <Tab.Screen
                name="Browser"
                options={{
                  tabBarLabel: "Browser",
                  headerShown: false,
                  tabBarIcon: function TabBarIcon({ color, size, focused }) {
                    return (
                      <MaterialCommunityIcons
                        name="web"
                        color={color}
                        size={size}
                        style={{ fontWeight: focused ? "bold" : "normal" }}
                      />
                    );
                  },
                }}
              >
                {(props) => <BrowserScreen {...props} items={items} />}
              </Tab.Screen>
              <Tab.Screen
                name="ShareDebug"
                options={{
                  tabBarLabel: "Debug",
                  tabBarIcon: function TabBarIcon({ color, size, focused }) {
                    return (
                      <MaterialCommunityIcons
                        name={focused ? "bug" : "bug-outline"}
                        color={color}
                        size={size}
                      />
                    );
                  },
                }}
              >
                {(props) => (
                  <ShareDebugScreen
                    {...props}
                    items={items}
                    extraData={extraData}
                  />
                )}
              </Tab.Screen>
              <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                  tabBarLabel: "Settings",
                  tabBarIcon: function TabBarIcon({ color, size, focused }) {
                    return (
                      <MaterialCommunityIcons
                        name={focused ? "cog" : "cog-outline"}
                        color={color}
                        size={size}
                      />
                    );
                  },
                }}
              />
            </Tab.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </AppSettings>
    </PaperProvider>
  );
};

export default App;
