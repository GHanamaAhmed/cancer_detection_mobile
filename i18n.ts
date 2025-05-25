import { getLocales } from "expo-localization";
import { I18n } from "i18n-js";
import en from "./languages/english.json";
import ar from "./languages/arabic.json";
import { I18nManager } from "react-native";

// Set the key-value pairs for the different languages you want to support.
const i18n = new I18n({
  en,
  ar,
});

i18n.locale = getLocales()[0].languageCode || "en"; // Default to English if locale is not found

// Handle RTL layout for Arabic
if (i18n.locale === "ar") {
  I18nManager.forceRTL(true);
} else {
  I18nManager.forceRTL(false);
}

export default i18n;

