import { Platform, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "~/lib/useColorScheme"; // Assuming this path is correct
import i18n from "../i18n"; // Make sure this path is correct for your i18n setup
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import * as Updates from "expo-updates"; // For reloading the app

export function SwitchLanguage({ className }: { className?: string }) {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  // Initialize currentLanguage state with the 2-letter code from i18n.locale, defaulting to 'en'
  // This initial value will reflect whatever i18n.locale is set to at the time this component mounts.
  const [currentLanguage, setCurrentLanguage] = useState(
    (i18n.locale || "ar").substring(0, 2)
  );
  const { isDarkColorScheme } = useColorScheme();

  useEffect(() => {
    const globalLocaleCode = (i18n.locale || "ar").substring(0, 2);
    if (currentLanguage !== globalLocaleCode) {
      setCurrentLanguage(globalLocaleCode);
    }
  }, [i18n.locale]); // Re-run this effect if i18n.locale changes

  const handleChangeLanguage = async (lang: "en" | "ar" | "fr") => {
    if (currentLanguage === lang) {
      setIsDropdownVisible(false);
      return; // Do nothing if the selected language is already active
    }

    try {
      // 1. Set the new locale for the i18n library
      i18n.locale = lang;
      // 2. Save the user's language preference to SecureStore for persistence
      await SecureStore.setItemAsync("userLanguage", lang);

      // 3. Reload the app to apply language changes globally
      // This is important because i18n-js (or react-i18next) might need a full reload
      // to re-evaluate all strings and potentially update RTL settings.
      if (Platform.OS !== "web") {
        await Updates.reloadAsync();
      } else {
        // For web, a standard window reload is sufficient
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to change language:", error);
      // You might want to show a user-friendly error message here
    } finally {
      setIsDropdownVisible(false); // Close the dropdown regardless of success/failure
    }
  };

  // Define the languages available in your switcher
  const languages = [
    { code: "en", name: "English" }, // Localize language names too!
    { code: "ar", name: "العربية" },
    { code: "fr", name: "Français" },
  ];

  return (
    <View className={className ? className : "absolute top-4 right-4 z-50"}>
      <TouchableOpacity
        onPress={() => setIsDropdownVisible(!isDropdownVisible)}
        className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-md flex-row items-center"
        accessibilityLabel={i18n.t("accessibility.switchLanguage")} // Localize accessibility label
        testID="language-toggle-button"
      >
        <Feather
          name="globe"
          size={20}
          color={isDarkColorScheme ? "#CBD5E1" : "#475569"}
        />
        <Text className="ml-1.5 font-medium text-slate-700 dark:text-slate-200">
          {/* Display the 2-letter code from state, in uppercase */}
          {currentLanguage.toUpperCase()}
        </Text>
      </TouchableOpacity>

      {isDropdownVisible && (
        <View
          className="absolute top-12 right-0 w-36 bg-white dark:bg-slate-700 rounded-md shadow-lg py-1 z-50"
          testID="language-dropdown"
        >
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              // Ensure the type assertion for `lang.code` if TypeScript complains
              onPress={() =>
                handleChangeLanguage(lang.code as "en" | "ar" | "fr")
              }
              className="px-4 py-3 flex-row justify-between items-center"
              testID={`language-option-${lang.code}`}
            >
              <Text className="text-sm text-slate-700 dark:text-slate-200">
                {lang.name}
              </Text>
              {/* Checkmark for the currently active language */}
              {currentLanguage === lang.code && (
                <Feather
                  name="check"
                  size={16}
                  color={isDarkColorScheme ? "#34D399" : "#10B981"}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
