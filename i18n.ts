import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import * as SecureStore from "expo-secure-store";
import { I18nManager } from "react-native"; // Import I18nManager for RTL

// --- Import your translation files ---
// IMPORTANT: Verify these paths and file contents
import en from "./languages/english.json";
import ar from "./languages/arabic.json";
import fr from "./languages/franch.json";

const i18n = new I18n({
  en,
  ar,
  fr,
});

// Set the default locale (fallback)
i18n.defaultLocale = "en"; // This is the fallback if a specific locale isn't found
i18n.enableFallback = true; // Crucial for falling back to defaultLocale

// Define a function to initialize the i18n locale
export const initI18n = async () => {
  console.log("--- Initializing i18n ---");
  console.log("i18n.defaultLocale:", i18n.defaultLocale);

  try {
    // 1. Try to load the saved language from SecureStore
    const savedLanguage = await SecureStore.getItemAsync("userLanguage");
    console.log("SecureStore retrieved userLanguage:", savedLanguage);

    let localeToSet = i18n.defaultLocale; // Start with the default fallback

    if (savedLanguage && i18n.translations[savedLanguage]) {
      console.log(`Found saved language '${savedLanguage}' with translations.`);
      localeToSet = savedLanguage;
    } else {
      console.log(
        "No saved language or no translations for saved language. Checking device locale."
      );
      // 2. Otherwise, use the device's preferred language
      const deviceLocales = Localization.getLocales();
      const deviceLocale = deviceLocales[0]?.languageCode;
      console.log("Device locales detected:", deviceLocales);
      console.log("Device language code (first locale):", deviceLocale);

      if (deviceLocale && i18n.translations[deviceLocale]) {
        console.log(`Found device locale '${deviceLocale}' with translations.`);
        localeToSet = deviceLocale;
      } else {
        console.log(
          `No device locale found with translations, defaulting to '${i18n.defaultLocale}'.`
        );
        localeToSet = i18n.defaultLocale;
      }
    }

    i18n.locale = localeToSet;
    console.log("FINAL i18n.locale set to:", i18n.locale);

    // Set RTL direction based on the resolved locale
    if (localeToSet === "ar") {
      I18nManager.forceRTL(true);
      I18nManager.allowRTL(true); // Ensure RTL is allowed
      console.log("Forcing RTL layout.");
    } else {
      I18nManager.forceRTL(false);
      I18nManager.allowRTL(false); // Disallow RTL for LTR languages
      console.log("Forcing LTR layout.");
    }

    // IMPORTANT: If you want immediate RTL layout change without full reload,
    // you might need to reload the app here if I18nManager.forceRTL() changes.
    // However, since `Updates.reloadAsync()` is used in `SwitchLanguage`,
    // this specific reload isn't strictly necessary here *unless* you're not using
    // `Updates.reloadAsync()` when first setting the language or after a cold start.
  } catch (error) {
    console.error("Error during i18n initialization:", error);
    // Ensure a fallback if an error occurs during initialization
    i18n.locale = i18n.defaultLocale;
    I18nManager.forceRTL(false); // Default to LTR on error
    console.log("i18n.locale fell back to default due to error:", i18n.locale);
  }
  console.log("--- i18n Initialization Complete ---");
};

export default i18n; // Export the i18n instance
