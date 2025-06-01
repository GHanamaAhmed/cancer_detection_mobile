import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import ENV from "~/lib/env";
import { Badge } from "~/components/ui/badge";
import { useColorScheme } from "~/lib/useColorScheme";
import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import {
  ApiResponse,
  HistoryData,
  LesionCaseHistory,
  RiskLevel,
} from "~/types/mobile-api";
import i18n from "~/i18n";

export default function HistoryScreen() {
  const { isDarkColorScheme } = useColorScheme();
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  const fetchHistoryData = async (
    pageNum: number = 1,
    showRefresh: boolean = false
  ): Promise<void> => {
    try {
      if (showRefresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      setError(null);
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        router.replace("/");
        return;
      }

      const response = await fetch(
        `${ENV.API_URL}/api/mobile/user/history?page=${pageNum}&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data: ApiResponse<HistoryData> = await response.json();

      if (!response.ok) {
        throw new Error(data.error || i18n.t("history.fetchError"));
      }

      if (pageNum === 1) {
        setHistoryData(data.data || null);
      } else {
        setHistoryData((prevData) => {
          if (!prevData || !data.data) return data.data;
          return {
            ...data.data,
            history: [...prevData.history, ...data.data.history],
          };
        });
      }
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching history data:", error);
      setError(
        error instanceof Error ? error.message : i18n.t("history.loadError")
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
      if (showRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const handleRefresh = useCallback(() => fetchHistoryData(1, true), []);

  const handleLoadMore = useCallback((): void => {
    if (
      !loadingMore &&
      historyData &&
      historyData.pagination &&
      page < historyData.pagination.pages
    ) {
      fetchHistoryData(page + 1);
    }
  }, [loadingMore, historyData, page]);

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case RiskLevel.LOW:
        return {
          color: isDarkColorScheme ? "#10b981" : "#059669",
          bg: isDarkColorScheme ? "bg-green-900/30" : "bg-green-100",
          text: isDarkColorScheme ? "text-green-400" : "text-green-700",
          label: i18n.t("history.lowRisk"),
        };
      case RiskLevel.MEDIUM:
        return {
          color: isDarkColorScheme ? "#f59e0b" : "#d97706",
          bg: isDarkColorScheme ? "bg-yellow-900/30" : "bg-yellow-100",
          text: isDarkColorScheme ? "text-yellow-400" : "text-yellow-700",
          label: i18n.t("history.mediumRisk"),
        };
      case RiskLevel.HIGH:
        return {
          color: isDarkColorScheme ? "#ef4444" : "#dc2626",
          bg: isDarkColorScheme ? "bg-red-900/30" : "bg-red-100",
          text: isDarkColorScheme ? "text-red-400" : "text-red-700",
          label: i18n.t("history.highRisk"),
        };
      case RiskLevel.CRITICAL:
        return {
          color: isDarkColorScheme ? "#ef4444" : "#dc2626",
          bg: isDarkColorScheme ? "bg-red-900/50" : "bg-red-200",
          text: isDarkColorScheme ? "text-red-300" : "text-red-700",
          label: i18n.t("history.criticalRisk"),
        };
      default:
        return {
          color: isDarkColorScheme ? "#94a3b8" : "#64748b",
          bg: isDarkColorScheme ? "bg-slate-800" : "bg-slate-100",
          text: isDarkColorScheme ? "text-slate-400" : "text-slate-700",
          label: i18n.t("history.unknownRisk"),
        };
    }
  };

  const renderItem = ({ item }: { item: LesionCaseHistory }) => {
    const riskStyle = getRiskBadge(item.riskLevel);

    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/result-detail",
            params: { id: item.id },
          })
        }
        className="mb-3"
      >
        <Card className="overflow-hidden">
          <View className="flex-row">
            {item.mainImage ? (
              <Image
                source={{ uri: item.mainImage.url }}
                className="w-24 h-24 bg-gray-100 dark:bg-gray-800"
                resizeMode="cover"
              />
            ) : (
              <View className="w-24 h-24 bg-gray-100 dark:bg-gray-800 items-center justify-center">
                <Feather
                  name="camera-off"
                  size={24}
                  color={isDarkColorScheme ? "#64748b" : "#94a3b8"}
                />
              </View>
            )}
            <View className="p-3 flex-1 justify-between">
              <View>
                <Text className="font-medium text-slate-800 dark:text-white">
                  {item.caseNumber}
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  {item.formattedDate}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Badge className={`${riskStyle.bg} ${riskStyle.text}`}>
                    {riskStyle.label}
                  </Badge>
                  {item.latestAnalysis?.reviewedByDoctor && (
                    <View className="ml-2 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                      <Text className="text-xs text-blue-700 dark:text-blue-400">
                        {i18n.t("history.doctorReviewed")}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View className="flex-row items-center justify-between mt-2">
                <View className="flex-row items-center">
                  <Feather
                    name="camera"
                    size={14}
                    color={isDarkColorScheme ? "#94a3b8" : "#64748b"}
                  />
                  <Text className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                    {item.imageCount}{" "}
                    {item.imageCount === 1
                      ? i18n.t("history.imageSingular")
                      : i18n.t("history.imagePlural")}
                  </Text>
                </View>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  {item.bodyLocation
                    ? String(item.bodyLocation).replace("_", " ").toLowerCase()
                    : i18n.t("history.unknownLocation")}
                </Text>
              </View>
            </View>
            <View className="absolute top-2 right-2">
              <Feather
                name="chevron-right"
                size={16}
                color={isDarkColorScheme ? "#94a3b8" : "#64748b"}
              />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const ListEmptyComponent = () => (
    <View className="items-center justify-center py-8">
      <Feather
        name="clock"
        size={48}
        color={isDarkColorScheme ? "#64748b" : "#94a3b8"}
      />
      <Text className="mt-4 text-center text-slate-600 dark:text-slate-400">
        {i18n.t("history.emptyTitle")}
      </Text>
      <Text className="mb-4 text-center text-slate-500 dark:text-slate-500">
        {i18n.t("history.emptySubtitle")}
      </Text>
      <Button onPress={() => router.push("/(tabs)/capture")} variant="primary">
        {i18n.t("history.scanButton")}
      </Button>
    </View>
  );

  const ListFooterComponent = () => {
    if (loadingMore) {
      return (
        <View className="py-4 items-center">
          <ActivityIndicator
            size="small"
            color={isDarkColorScheme ? "#0ea5e9" : "#0284c7"}
          />
        </View>
      );
    }
    if (
      historyData &&
      historyData.pagination &&
      historyData.history.length > 0 &&
      page >= historyData.pagination.pages
    ) {
      return (
        <Text className="text-center py-4 text-slate-500 dark:text-slate-400">
          {i18n.t("history.endOfHistory")}
        </Text>
      );
    }
    return null;
  };

  return (
    <SafeAreaView
      className="flex-1 bg-teal-50 dark:bg-slate-900"
      edges={["top"]}
    >
      <Stack.Screen
        options={{
          title: i18n.t("history.title"),
          headerStyle: {
            backgroundColor: isDarkColorScheme ? "#0f172a" : "#f0fdfa",
          },
          headerTintColor: isDarkColorScheme ? "#f8fafc" : "#0f172a",
        }}
      />
      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator
            size="large"
            color={isDarkColorScheme ? "#0ea5e9" : "#0284c7"}
          />
          <Text className="mt-4 text-slate-600 dark:text-slate-400">
            {i18n.t("history.loading")}
          </Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center p-6">
          <Feather
            name="alert-circle"
            size={48}
            color={isDarkColorScheme ? "#ef4444" : "#dc2626"}
          />
          <Text className="mt-4 text-slate-600 dark:text-slate-400 text-center">
            {error}
          </Text>
          <Button
            onPress={() => fetchHistoryData()}
            className="mt-4"
            variant="primary"
          >
            {i18n.t("history.tryAgain")}
          </Button>
        </View>
      ) : (
        <FlatList
          data={historyData?.history || []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={ListEmptyComponent}
          ListFooterComponent={ListFooterComponent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}
