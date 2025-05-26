import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Avatar } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { useColorScheme } from "~/lib/useColorScheme";
import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { DashboardData } from "~/types/mobile-api";
import ENV from "~/lib/env";
import { usePusher } from "~/lib/pusher-client";
import { Audio } from "expo-av";
// Define Notification type
type Notification = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: string;
  actionUrl?: string;
};

export default function HomeScreen() {
  const { isDarkColorScheme } = useColorScheme();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Notification states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { pusherClient } = usePusher();

  const [notificationSound, setNotificationSound] =
    useState<Audio.Sound | null>(null);

  // Load sound on component mount
  useEffect(() => {
    async function loadSound() {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("~/assets/mixkit-long-pop-2358.mp3"),
          {
            shouldPlay: false,
          }
        );
        setNotificationSound(sound);
      } catch (error) {
        console.error("Failed to load notification sound:", error);
      }
    }

    loadSound();

    // Unload sound on unmount
    return () => {
      if (notificationSound) {
        notificationSound.unloadAsync();
      }
    };
  }, []);

  const playNotificationSound = async () => {
    try {
      console.log("Playing notification sound");

      // Create a new sound instance each time
      const soundObject = new Audio.Sound();

      // Load and play in one operation
      await soundObject.loadAsync(require("~/assets/mixkit-long-pop-2358.mp3"));
      await soundObject.playAsync();

      // Clean up when done
      soundObject.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          soundObject.unloadAsync();
        }
      });
    } catch (error) {
      console.error("Failed to play notification sound:", error);
    }
  };
  // Fetch user ID on mount
  useEffect(() => {
    async function fetchUserId() {
      try {
        const userString = await SecureStore.getItemAsync("user");
        if (userString) {
          const userData = JSON.parse(userString);
          setUserId(userData.id);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }

    fetchUserId();
  }, []);

  // Set up Pusher for real-time notifications
  useEffect(() => {
    if (!userId || !pusherClient) return; // Remove notificationSound check

    const channelName = `private-notifications-${userId}`;

    pusherClient.subscribe({
      channelName,
      onEvent: (event) => {
        if (event.eventName === "new-notification") {
          const notification = JSON.parse(event.data) as Notification;
          console.log("Received new notification:", notification);

          // Play sound on main thread
          setTimeout(() => {
            playNotificationSound();
          }, 0);

          setNotifications((prev) => [notification, ...prev]);
        } else if (event.eventName === "notification-read") {
          const data = JSON.parse(event.data) as { id: string };
          setNotifications((prev) =>
            prev.map((notif) =>
              notif.id === data.id ? { ...notif, isRead: true } : notif
            )
          );
        }
      },
      onSubscriptionError: (error) => {
        console.error("Notification subscription error:", error);
      },
    });

    return () => {
      console.log("Unsubscribing from notifications channel");
      if (pusherClient) {
        pusherClient.unsubscribe({ channelName });
      }
    };
  }, [userId, pusherClient]);

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  const fetchNotifications = async () => {
    if (!userId) return;

    setIsLoadingNotifications(true);
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) return;

      const response = await fetch(`${ENV.API_URL}/api/mobile/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) return;

      await fetch(`${ENV.API_URL}/api/mobile/notifications/${id}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

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

      const response = await fetch(`${ENV.API_URL}/api/mobile/user/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
  const handleRefresh = () => {
    fetchDashboardData(true);
    fetchNotifications();
  };

  // Calculate unread notifications count
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Notification Modal Component
  const NotificationModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showNotifications}
      onRequestClose={() => setShowNotifications(false)}
    >
      <View className="flex-1 justify-end bg-black/30">
        <View className="bg-white dark:bg-slate-800 rounded-t-3xl h-2/3">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <Text className="text-xl font-bold text-slate-800 dark:text-white">
              Notifications
            </Text>
            <TouchableOpacity onPress={() => setShowNotifications(false)}>
              <Feather
                name="x"
                size={24}
                color={isDarkColorScheme ? "#f1f5f9" : "#334155"}
              />
            </TouchableOpacity>
          </View>

          {isLoadingNotifications ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator
                size="large"
                color={isDarkColorScheme ? "#0ea5e9" : "#0284c7"}
              />
              <Text className="mt-2 text-slate-600 dark:text-slate-400">
                Loading notifications...
              </Text>
            </View>
          ) : notifications.length > 0 ? (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              contentContainerClassName="p-4"
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`mb-4 p-3 rounded-lg border ${
                    !item.isRead
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                  onPress={() => {
                    if (!item.isRead) {
                      markAsRead(item.id);
                    }
                    if (item.actionUrl) {
                      setShowNotifications(false);
                    }
                  }}
                >
                  <View className="flex-row justify-between items-center">
                    <Text className="font-medium text-slate-800 dark:text-white">
                      {item.title}
                    </Text>
                    {!item.isRead && (
                      <View className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </View>
                  <Text className="text-slate-600 dark:text-slate-300 my-1">
                    {item.message}
                  </Text>
                  <Text className="text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View className="h-1" />}
              refreshControl={
                <RefreshControl
                  refreshing={isLoadingNotifications}
                  onRefresh={fetchNotifications}
                />
              }
            />
          ) : (
            <View className="flex-1 items-center justify-center p-4">
              <Feather
                name="bell-off"
                size={40}
                color={isDarkColorScheme ? "#94a3b8" : "#64748b"}
              />
              <Text className="mt-4 text-center text-slate-600 dark:text-slate-400">
                No notifications yet
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getRiskBadge = (risk: string) => {
    switch (risk.toLocaleUpperCase()) {
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
      {/* Notification Modal */}
      <NotificationModal />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, padding: 0 }}
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
                <View className="flex-row items-center w-full justify-between">
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
                  <TouchableOpacity
                    className="relative mb-6"
                    onPress={() => setShowNotifications(true)}
                  >
                    <Feather
                      name="bell"
                      size={24}
                      color={isDarkColorScheme ? "#f1f5f9" : "#334155"}
                    />
                    {unreadCount > 0 && (
                      <View className="absolute -right-2 -top-2 h-5 w-5 bg-red-500 rounded-full items-center justify-center">
                        <Text className="text-xs text-white font-bold">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
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
                          pathname: "/(tabs)/appointment-detail",
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
