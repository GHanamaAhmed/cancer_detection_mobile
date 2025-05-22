import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ThemeToggle } from "~/components/theme-toggle";
import { Avatar } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { useColorScheme } from "~/lib/useColorScheme";
import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { DashboardData } from "~/types/mobile-api";

export default function HomeScreen() {
  const { isDarkColorScheme } = useColorScheme();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);

      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        router.replace("/");
        return;
      }

      const response = await fetch(
        "http://192.168.10.30:3000/api/mobile/user/dashboard",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch dashboard data");
      }

      setDashboardData(data.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
      if (showRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "LOW":
        return {
          color: isDarkColorScheme ? "#10b981" : "#059669",
          bg: isDarkColorScheme ? "bg-green-900/30" : "bg-green-100",
          text: isDarkColorScheme ? "text-green-400" : "text-green-700",
          label: "Low Risk",
        };
      case "MEDIUM":
        return {
          color: isDarkColorScheme ? "#f59e0b" : "#d97706",
          bg: isDarkColorScheme ? "bg-yellow-900/30" : "bg-yellow-100",
          text: isDarkColorScheme ? "text-yellow-400" : "text-yellow-700",
          label: "Medium Risk",
        };
      case "HIGH":
        return {
          color: isDarkColorScheme ? "#ef4444" : "#dc2626",
          bg: isDarkColorScheme ? "bg-red-900/30" : "bg-red-100",
          text: isDarkColorScheme ? "text-red-400" : "text-red-700",
          label: "High Risk",
        };
      case "CRITICAL":
        return {
          color: isDarkColorScheme ? "#ef4444" : "#dc2626",
          bg: isDarkColorScheme ? "bg-red-900/50" : "bg-red-200",
          text: isDarkColorScheme ? "text-red-300" : "text-red-700",
          label: "Critical Risk",
        };
      default:
        return {
          color: isDarkColorScheme ? "#94a3b8" : "#64748b",
          bg: isDarkColorScheme ? "bg-slate-800" : "bg-slate-100",
          text: isDarkColorScheme ? "text-slate-400" : "text-slate-700",
          label: "Unknown",
        };
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-teal-50 dark:bg-slate-900"
      edges={["top"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Card className="w-full max-w-md mx-auto flex-1">
          <View className="px-6 pt-8 pb-8">
            {loading && !refreshing ? (
              <View className="items-center justify-center py-8">
                <ActivityIndicator
                  size="large"
                  color={isDarkColorScheme ? "#0ea5e9" : "#0284c7"}
                />
                <Text className="mt-4 text-slate-600 dark:text-slate-400">
                  Loading your dashboard...
                </Text>
              </View>
            ) : error ? (
              <View className="items-center justify-center py-8">
                <Feather
                  name="alert-circle"
                  size={48}
                  color={isDarkColorScheme ? "#ef4444" : "#dc2626"}
                />
                <Text className="mt-4 text-slate-600 dark:text-slate-400 text-center">
                  {error}
                </Text>
                <Button
                  onPress={() => fetchDashboardData()}
                  className="mt-4"
                  variant="primary"
                >
                  Try Again
                </Button>
              </View>
            ) : (
              <>
                {/* User Profile Section */}
                <View className="flex-row items-center mb-6">
                  <Avatar
                    fallback={
                      dashboardData?.user?.fullName
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "U"
                    }
                    source={
                      dashboardData?.user?.profileImage ||
                      "https://ui-avatars.com/api/?name=User"
                    }
                    className="h-16 w-16 mr-4"
                  />
                  <View>
                    <Text className="text-xl font-bold text-slate-800 dark:text-white">
                      {dashboardData?.user?.fullName || "Welcome"}
                    </Text>
                    <Text className="text-sm text-slate-500 dark:text-slate-400">
                      Let's check your skin health today
                    </Text>
                  </View>
                </View>

                {/* Health Analytics */}
                <View className="mb-6">
                  <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Skin Health Analytics
                  </Text>

                  {dashboardData?.analytics ? (
                    <View>
                      <View className="flex-row gap-3">
                        <View className="flex-1 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-lg p-3 items-center">
                          <Feather
                            name="camera"
                            size={24}
                            color={isDarkColorScheme ? "#22d3ee" : "#0ea5e9"}
                            className="mb-1"
                          />
                          <Text className="text-lg font-bold text-slate-800 dark:text-white">
                            {dashboardData.analytics.totalScans || 0}
                          </Text>
                          <Text className="text-xs text-gray-500 dark:text-gray-400">
                            Total Scans
                          </Text>
                        </View>

                        <View className="flex-1 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-lg p-3 items-center">
                          <Feather
                            name="shield"
                            size={24}
                            color={
                              dashboardData.analytics.highRiskCases > 0
                                ? isDarkColorScheme
                                  ? "#f87171"
                                  : "#ef4444"
                                : isDarkColorScheme
                                ? "#34d399"
                                : "#10b981"
                            }
                            className="mb-1"
                          />
                          <Text className="text-lg font-bold text-slate-800 dark:text-white">
                            {dashboardData.analytics.lowRiskCases || 0}
                          </Text>
                          <Text className="text-xs text-gray-500 dark:text-gray-400">
                            Low Risk Lesions
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row gap-3 mt-3">
                        <View className="flex-1 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-lg p-3 items-center">
                          <Feather
                            name="calendar"
                            size={24}
                            color={isDarkColorScheme ? "#a5b4fc" : "#6366f1"}
                            className="mb-1"
                          />
                          <Text className="text-lg font-bold text-slate-800 dark:text-white">
                            {dashboardData.analytics.daysSinceLastCheck || 0}
                          </Text>
                          <Text className="text-xs text-gray-500 dark:text-gray-400">
                            Days Since Check
                          </Text>
                        </View>

                        <View className="flex-1 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-lg p-3 items-center">
                          <Feather
                            name="alert-circle"
                            size={24}
                            color={
                              dashboardData.analytics.followUpNeeded
                                ? isDarkColorScheme
                                  ? "#fbbf24"
                                  : "#f59e0b"
                                : isDarkColorScheme
                                ? "#34d399"
                                : "#10b981"
                            }
                            className="mb-1"
                          />
                          <Text className="text-lg font-bold text-slate-800 dark:text-white">
                            {dashboardData.analytics.monitoredLesions || 0}
                          </Text>
                          <Text className="text-xs text-gray-500 dark:text-gray-400">
                            Active Monitoring
                          </Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 p-4">
                      <Text className="text-center text-gray-500 dark:text-gray-400">
                        No health analytics available yet.
                      </Text>
                      <TouchableOpacity
                        onPress={() => router.push("/(tabs)/capture")}
                        className="mt-3 bg-teal-500 rounded-lg py-2 items-center"
                      >
                        <Text className="text-white font-medium">
                          Take your first scan
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Recent Results */}
                <View className="mb-6">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Recent Results
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push("/(tabs)/history")}
                      className="py-1"
                    >
                      <Text className="text-xs font-medium text-teal-600 dark:text-teal-400">
                        See All
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {dashboardData?.recentResults &&
                  dashboardData.recentResults.length > 0 ? (
                    <View className="space-y-3">
                      {dashboardData.recentResults.map((result) => {
                        const riskStyle = getRiskBadge(result.riskLevel);
                        return (
                          <TouchableOpacity
                            key={result.id}
                            onPress={() =>
                              router.push({
                                pathname: "/result-detail",
                                params: { id: result.id },
                              })
                            }
                            className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 p-3 flex-row justify-between items-center"
                          >
                            <View>
                              <Text className="font-medium text-slate-800 dark:text-white">
                                {result.title}
                              </Text>
                              <Text className="text-xs text-slate-500 dark:text-slate-400">
                                {result.date}
                              </Text>
                            </View>
                            <Badge
                              className={`${riskStyle.bg} ${riskStyle.text}`}
                            >
                              {riskStyle.label}
                            </Badge>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <View className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 p-4">
                      <Text className="text-center text-gray-500 dark:text-gray-400">
                        No recent results available.
                      </Text>
                    </View>
                  )}
                </View>

                {/* Upcoming Appointment */}
                <View>
                  <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Upcoming Appointment
                  </Text>

                  {dashboardData?.upcomingAppointment ? (
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/appointments",
                          params: { id: dashboardData.upcomingAppointment?.id },
                        })
                      }
                      className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 p-4"
                    >
                      <View className="flex-row items-center">
                        <View className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 items-center justify-center mr-3">
                          <Feather
                            name="calendar"
                            size={20}
                            color={isDarkColorScheme ? "#93c5fd" : "#3b82f6"}
                          />
                        </View>
                        <View>
                          <Text className="font-medium text-slate-800 dark:text-white">
                            {dashboardData.upcomingAppointment.doctorName}
                          </Text>
                          <Text className="text-xs text-slate-500 dark:text-slate-400">
                            {dashboardData.upcomingAppointment.doctorSpecialty}
                          </Text>
                        </View>
                        <View className="ml-auto">
                          <Text className="text-right font-medium text-slate-800 dark:text-white">
                            {dashboardData.upcomingAppointment.date}
                          </Text>
                          <Text className="text-right text-xs text-slate-500 dark:text-slate-400">
                            {dashboardData.upcomingAppointment.time}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <View className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 p-4">
                      <Text className="text-center text-gray-500 dark:text-gray-400">
                        No upcoming appointments.
                      </Text>
                      <TouchableOpacity
                        onPress={() => router.push("/doctors")}
                        className="mt-3 bg-teal-500 rounded-lg py-2 items-center"
                      >
                        <Text className="text-white font-medium">
                          Find a Doctor
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Quick Actions */}
                <View className="mt-8">
                  <View className="flex-row gap-3">
                    <Button
                      onPress={() => router.push("/(tabs)/capture")}
                      className="flex-1 bg-teal-500"
                      icon={<Feather name="camera" size={18} color="white" />}
                      iconPosition="left"
                    >
                      New Scan
                    </Button>
                    <Button
                      onPress={() => router.push("/history")}
                      className="flex-1 bg-blue-500"
                      icon={<Feather name="clock" size={18} color="white" />}
                      iconPosition="left"
                    >
                      History
                    </Button>
                  </View>
                </View>
              </>
            )}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
