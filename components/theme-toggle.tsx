import { TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "~/lib/useColorScheme";
import { setAndroidNavigationBar } from "~/lib/android-navigation-bar";

export function ThemeToggle() {
  const { isDarkColorScheme, setColorScheme } = useColorScheme();

  function toggleColorScheme() {
    const newTheme = isDarkColorScheme ? "light" : "dark";
    setColorScheme(newTheme);
    setAndroidNavigationBar(newTheme);
  }

  return (
    <TouchableOpacity
      onPress={toggleColorScheme}
      className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white dark:bg-slate-800 shadow-md"
      accessibilityLabel="Toggle theme"
    >
      {isDarkColorScheme ? (
        <Feather name="sun" size={20} color="#F59E0B" />
      ) : (
        <Feather name="moon" size={20} color="#334155" />
      )}
    </TouchableOpacity>
  );
}
