import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useColorScheme } from "~/lib/useColorScheme";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}: TabsProps) {
  const { isDarkColorScheme } = useColorScheme();

  return (
    <View
      className={`flex-row border-b border-gray-200 dark:border-gray-800 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            className={`flex-1 py-3 px-2 ${
              isActive ? "border-b-2 border-teal-500" : ""
            }`}
          >
            <Text
              className={`text-center ${
                isActive
                  ? "font-medium text-teal-600 dark:text-teal-400"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
