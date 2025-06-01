import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "~/components/theme-provider";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect, useState } from "react";
import { initI18n } from "~/i18n";
import { View } from "react-native";

export default function RootLayout() {
  const [isI18nReady, setIsI18nReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      console.log("App.js: Starting i18n initialization...");
      await initI18n(); // THIS IS CRUCIAL: AWAIT THE ASYNC FUNCTION
      console.log(
        "App.js: i18n initialization complete. Setting isI18nReady to true."
      );
      setIsI18nReady(true);
    };

    initializeApp();
  }, []); // Run only once on mount
  return isI18nReady ? (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: "transparent",
              },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="results" />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  ) : (
    <View></View>
  );
}
