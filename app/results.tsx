"use client";

import { View, Text, ScrollView, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useTheme } from "@react-navigation/native";
import { ThemeToggle } from "~/components/theme-toggle";
import { useColorScheme } from "~/lib/useColorScheme";
export default function ResultsScreen() {
  const { isDarkColorScheme } = useColorScheme();

  return (
    <ScrollView className="flex-1 bg-teal-50 dark:bg-slate-900">
      <ThemeToggle />
      <View className="p-4">
        <Card className="w-full max-w-md mx-auto">
          <View className="px-6 pt-8 pb-4">
            <Text className="text-2xl font-bold mb-1 text-slate-800 dark:text-white">
              Analysis Results
            </Text>
            <Text className="text-gray-500 dark:text-gray-400">
              Based on your image capture
            </Text>
          </View>

          <View className="px-6 pb-6">
            <View className="gap-6">
              <View className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                <View className="flex-row">
                  <Feather
                    name="alert-triangle"
                    size={20}
                    color="#f59e0b"
                    className="mr-3 mt-0.5"
                  />
                  <View>
                    <Text className="font-medium text-amber-800 dark:text-amber-300">
                      Medium Risk Detected
                    </Text>
                    <Text className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                      We recommend consulting a dermatologist within 48 hours.
                    </Text>
                  </View>
                </View>
              </View>

              <View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm font-medium text-slate-800 dark:text-white">
                    Risk Assessment
                  </Text>
                  <Text className="text-sm font-medium text-amber-500">
                    Medium
                  </Text>
                </View>
                <View className="relative pt-1">
                  <View className="flex-row mb-2 items-center justify-between">
                    <View>
                      <Badge variant="warning" className="uppercase">
                        Confidence: 78%
                      </Badge>
                    </View>
                  </View>
                  <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: "78%" }}
                    />
                  </View>
                </View>
              </View>

              <View className="bg-white dark:bg-slate-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                <Text className="font-medium mb-3 text-slate-800 dark:text-white">
                  Key Observations
                </Text>
                <View className="gap-2">
                  <View className="flex-row">
                    <View className="h-1.5 w-1.5 rounded-full bg-teal-500 mt-1.5 mr-2" />
                    <Text className="text-slate-800 dark:text-white">
                      Irregular border pattern detected
                    </Text>
                  </View>
                  <View className="flex-row">
                    <View className="h-1.5 w-1.5 rounded-full bg-teal-500 mt-1.5 mr-2" />
                    <Text className="text-slate-800 dark:text-white">
                      Asymmetrical shape characteristics
                    </Text>
                  </View>
                  <View className="flex-row">
                    <View className="h-1.5 w-1.5 rounded-full bg-teal-500 mt-1.5 mr-2" />
                    <Text className="text-slate-800 dark:text-white">
                      Color variation within the area
                    </Text>
                  </View>
                </View>
              </View>

              <View className="bg-white dark:bg-slate-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                <Text className="font-medium mb-2 text-slate-800 dark:text-white">
                  Recommendations
                </Text>
                <Text className="text-sm text-gray-600 dark:text-gray-300">
                  Based on our analysis, we recommend consulting with a
                  dermatologist for a professional evaluation. This is not a
                  medical diagnosis.
                </Text>
              </View>

              <View className="bg-white dark:bg-slate-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                <Text className="font-medium mb-3 text-slate-800 dark:text-white">
                  Detailed Analysis
                </Text>
                <View className="gap-3">
                  <View>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-sm text-slate-800 dark:text-white">
                        ABCDE Criteria
                      </Text>
                      <Badge variant="warning">3/5 Flags</Badge>
                    </View>
                    <View className="gap-2">
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                          <Text className="text-xs font-medium mr-2 text-slate-800 dark:text-white">
                            A - Asymmetry
                          </Text>
                          <Feather
                            name="check-circle"
                            size={16}
                            color="#f59e0b"
                          />
                        </View>
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                          Flagged
                        </Text>
                      </View>
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                          <Text className="text-xs font-medium mr-2 text-slate-800 dark:text-white">
                            B - Border
                          </Text>
                          <Feather
                            name="check-circle"
                            size={16}
                            color="#f59e0b"
                          />
                        </View>
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                          Flagged
                        </Text>
                      </View>
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                          <Text className="text-xs font-medium mr-2 text-slate-800 dark:text-white">
                            C - Color
                          </Text>
                          <Feather
                            name="check-circle"
                            size={16}
                            color="#f59e0b"
                          />
                        </View>
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                          Flagged
                        </Text>
                      </View>
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                          <Text className="text-xs font-medium mr-2 text-slate-800 dark:text-white">
                            D - Diameter
                          </Text>
                          <Feather
                            name="check-circle"
                            size={16}
                            color="#10b981"
                          />
                        </View>
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                          Normal
                        </Text>
                      </View>
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                          <Text className="text-xs font-medium mr-2 text-slate-800 dark:text-white">
                            E - Evolution
                          </Text>
                          <Feather
                            name="check-circle"
                            size={16}
                            color="#10b981"
                          />
                        </View>
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                          Normal
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              <View className="mt-6">
                <Text className="font-medium mb-3 text-slate-800 dark:text-white">
                  Similar Cases
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="pb-2"
                >
                  <View className="flex-row gap-3">
                    <View className="w-40 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden bg-white dark:bg-slate-700">
                      <View className="h-32 bg-gray-100 dark:bg-gray-600">
                        <Image
                          source={{
                            uri: "https://via.placeholder.com/160x128",
                          }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      </View>
                      <View className="p-3">
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-xs font-medium text-slate-800 dark:text-white">
                            Case #8294
                          </Text>
                          <Badge variant="warning">Medium</Badge>
                        </View>
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                          Diagnosed: Atypical nevus
                        </Text>
                      </View>
                    </View>
                    <View className="w-40 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden bg-white dark:bg-slate-700">
                      <View className="h-32 bg-gray-100 dark:bg-gray-600">
                        <Image
                          source={{
                            uri: "https://via.placeholder.com/160x128",
                          }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      </View>
                      <View className="p-3">
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-xs font-medium text-slate-800 dark:text-white">
                            Case #7651
                          </Text>
                          <Badge variant="warning">Medium</Badge>
                        </View>
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                          Diagnosed: Dysplastic nevus
                        </Text>
                      </View>
                    </View>
                    <View className="w-40 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden bg-white dark:bg-slate-700">
                      <View className="h-32 bg-gray-100 dark:bg-gray-600">
                        <Image
                          source={{
                            uri: "https://via.placeholder.com/160x128",
                          }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      </View>
                      <View className="p-3">
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-xs font-medium text-slate-800 dark:text-white">
                            Case #9103
                          </Text>
                          <Badge variant="danger">High</Badge>
                        </View>
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                          Diagnosed: Melanoma
                        </Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              </View>

              <View className="gap-3 mt-2">
                <Button
                  onPress={() => router.push("/(tabs)/doctors")}
                  icon={<Feather name="arrow-right" size={18} color="white" />}
                  iconPosition="right"
                >
                  Find a Dermatologist
                </Button>
                <Button
                  variant="outline"
                  onPress={() => router.push("/(tabs)/appointments")}
                  icon={
                    <Feather
                      name="calendar"
                      size={18}
                      color={isDarkColorScheme ? "#fff" : "#334155"}
                    />
                  }
                  iconPosition="left"
                >
                  Schedule Appointment
                </Button>
              </View>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}
