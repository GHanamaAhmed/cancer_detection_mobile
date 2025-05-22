"use client";

import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "../components/ui/badge";
import { useColorScheme } from "~/lib/useColorScheme";

// Sample data for results
const RESULTS_DATA = [
  {
    id: "1",
    title: "Skin Analysis",
    date: "Nov 15, 2023",
    riskLevel: "Medium Risk",
    variant: "warning",
  },
  {
    id: "2",
    title: "Blood Pressure",
    date: "Nov 10, 2023",
    riskLevel: "Low Risk",
    variant: "success",
  },
  {
    id: "3",
    title: "Skin Analysis",
    date: "Oct 28, 2023",
    riskLevel: "High Risk",
    variant: "destructive",
  },
  {
    id: "4",
    title: "Heart Rate",
    date: "Oct 22, 2023",
    riskLevel: "Low Risk",
    variant: "success",
  },
  {
    id: "5",
    title: "Skin Analysis",
    date: "Oct 15, 2023",
    riskLevel: "Medium Risk",
    variant: "warning",
  },
];

export default function ResultsListScreen() {
  const { isDarkColorScheme: isDarkMode } = useColorScheme();

  return (
    <SafeAreaView
      className="flex-1 bg-teal-50 dark:bg-slate-900"
      edges={["top"]}
    >
      <View className="flex-row items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Feather
            name="arrow-left"
            size={24}
            color={isDarkMode ? "#fff" : "#334155"}
          />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-800 dark:text-white">
          All Results
        </Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="gap-4">
          {RESULTS_DATA.map((result) => (
            <TouchableOpacity
              key={result.id}
              onPress={() => router.push(`/results?id=${result.id}`)}
              className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-700"
            >
              <View className="p-4 flex-row justify-between items-center">
                <View>
                  <Text className="font-medium text-slate-800 dark:text-white">
                    {result.title}
                  </Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    {result.date}
                  </Text>
                </View>
                <Badge variant={result.variant as any}>
                  {result.riskLevel}
                </Badge>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
