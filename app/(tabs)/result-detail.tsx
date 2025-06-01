import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  useWindowDimensions,
  Animated,
  Platform,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { useColorScheme } from "~/lib/useColorScheme";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  ApiResponse,
  ResultDetailData,
  RiskLevel,
  CaseImage,
} from "~/types/mobile-api";
import { Alert, Modal, View as RNView } from "react-native";
import { Trash2 } from "lucide-react-native";
import ENV from "~/lib/env";
import i18n from "~/i18n";

/**
 * Result Detail Screen - Shows detailed information about a skin check case
 */
export default function ResultDetailScreen() {
  const { isDarkColorScheme } = useColorScheme();
  const params = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);

  const [caseDetail, setCaseDetail] = useState<ResultDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("details");
  const [deletingCase, setDeletingCase] = useState<boolean>(false);

  // Animated values for tab transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCaseDetail()
      .then(() => setRefreshing(false))
      .catch((err) => {
        console.error(i18n.t("result.loadError"), err);
        setRefreshing(false);
      });
  };
  /**
   * Fetches case detail data from API
   */
  const fetchCaseDetail = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        router.replace("/");
        return;
      }
      const response = await fetch(
        `${ENV.API_URL}/api/mobile/result/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data: ApiResponse<ResultDetailData> = await response.json();
      if (!response.ok) {
        throw new Error(data.error || i18n.t("result.loadError"));
      }
      setCaseDetail(data.data || null);
    } catch (error) {
      console.error(i18n.t("result.loadError"), error);
      setError(
        error instanceof Error ? error.message : i18n.t("result.loadError")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetail();
  }, [params.id]);

  const changeTab = (tab: string) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    setTimeout(() => {
      setActiveTab(tab);
    }, 150);
  };

  /**
   * Get badge style based on risk level
   */
  const getRiskBadge = (risk: string) => {
    switch (risk.toUpperCase()) {
      case RiskLevel.LOW:
        return {
          color: isDarkColorScheme ? "#10b981" : "#059669",
          bg: isDarkColorScheme ? "bg-green-900/30" : "bg-green-100",
          text: isDarkColorScheme ? "text-green-400" : "text-green-700",
          label: i18n.t("result.riskLevel.low"),
        };
      case RiskLevel.MEDIUM:
        return {
          color: isDarkColorScheme ? "#f59e0b" : "#d97706",
          bg: isDarkColorScheme ? "bg-yellow-900/30" : "bg-yellow-100",
          text: isDarkColorScheme ? "text-yellow-400" : "text-yellow-700",
          label: i18n.t("result.riskLevel.medium"),
        };
      case RiskLevel.HIGH:
        return {
          color: isDarkColorScheme ? "#ef4444" : "#dc2626",
          bg: isDarkColorScheme ? "bg-red-900/30" : "bg-red-100",
          text: isDarkColorScheme ? "text-red-400" : "text-red-700",
          label: i18n.t("result.riskLevel.high"),
        };
      case RiskLevel.CRITICAL:
        return {
          color: isDarkColorScheme ? "#ef4444" : "#dc2626",
          bg: isDarkColorScheme ? "bg-red-900/50" : "bg-red-200",
          text: isDarkColorScheme ? "text-red-300" : "text-red-700",
          label: i18n.t("result.riskLevel.critical"),
        };
      default:
        return {
          color: isDarkColorScheme ? "#94a3b8" : "#64748b",
          bg: isDarkColorScheme ? "bg-slate-800" : "bg-slate-100",
          text: isDarkColorScheme ? "text-slate-400" : "text-slate-700",
          label: i18n.t("result.riskLevel.unknown"),
        };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return {
          bg: isDarkColorScheme ? "bg-blue-900/30" : "bg-blue-100",
          text: isDarkColorScheme ? "text-blue-400" : "text-blue-700",
        };
      case "MONITORING":
        return {
          bg: isDarkColorScheme ? "bg-purple-900/30" : "bg-purple-100",
          text: isDarkColorScheme ? "text-purple-400" : "text-purple-700",
        };
      case "CLOSED":
        return {
          bg: isDarkColorScheme ? "bg-gray-900/30" : "bg-gray-100",
          text: isDarkColorScheme ? "text-gray-400" : "text-gray-700",
        };
      case "REFERRED":
        return {
          bg: isDarkColorScheme ? "bg-orange-900/30" : "bg-orange-100",
          text: isDarkColorScheme ? "text-orange-400" : "text-orange-700",
        };
      default:
        return {
          bg: isDarkColorScheme ? "bg-slate-800" : "bg-slate-100",
          text: isDarkColorScheme ? "text-slate-400" : "text-slate-700",
        };
    }
  };

  /**
   * Renders images with thumbnail navigation
   */
  const renderImageGallery = () => {
    if (!caseDetail?.images.length) {
      return (
        <View className="bg-gray-100 dark:bg-gray-800 h-64 rounded-lg items-center justify-center">
          <Feather
            name="camera-off"
            size={48}
            color={isDarkColorScheme ? "#64748b" : "#94a3b8"}
          />
          <Text className="mt-2 text-gray-500 dark:text-gray-400">
            {i18n.t("result.noImagesAvailable")}
          </Text>
        </View>
      );
    }
    return (
      <View>
        <View className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image
            source={{ uri: caseDetail.images[activeImageIndex].url }}
            style={{ width: "100%", height: 300 }}
            resizeMode="contain"
          />
        </View>
        {caseDetail.images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row mt-2"
          >
            {caseDetail.images.map((image, index) => (
              <TouchableOpacity
                key={image.id}
                onPress={() => setActiveImageIndex(index)}
                className={`mr-2 rounded-md overflow-hidden border-2 ${
                  index === activeImageIndex
                    ? "border-teal-500 dark:border-teal-400"
                    : "border-transparent"
                }`}
              >
                <Image
                  source={{ uri: image.thumbnailUrl || image.url }}
                  style={{ width: 60, height: 60 }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        <View className="mt-2 flex-row justify-between items-center">
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {caseDetail.images[activeImageIndex].captureDate}
          </Text>
          {caseDetail.images[activeImageIndex].bodyLocation && (
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {String(caseDetail.images[activeImageIndex].bodyLocation)
                .replace("_", " ")
                .toLowerCase() || i18n.t("result.unknownLocation")}
            </Text>
          )}
        </View>
      </View>
    );
  };

  /**
   * Renders the ABCDE criteria analysis
   */
  const renderABCDECriteria = () => {
    if (!caseDetail?.latestAnalysis?.abcdeResults) {
      return null;
    }

    const abcde = caseDetail.latestAnalysis.abcdeResults;

    const criteria = [
      {
        letter: "A",
        name: "Asymmetry",
        flag: abcde.asymmetry,
        score: abcde.asymmetryScore,
        description: "One half is unlike the other half",
      },
      {
        letter: "B",
        name: "Border",
        flag: abcde.border,
        score: abcde.borderScore,
        description: "Irregular, ragged, notched, or blurred edges",
      },
      {
        letter: "C",
        name: "Color",
        flag: abcde.color,
        score: abcde.colorScore,
        description: "Varied colors or uneven distribution",
      },
      {
        letter: "D",
        name: "Diameter",
        flag: abcde.diameter,
        value: abcde.diameterValue,
        description: "Larger than 6mm (pencil eraser)",
      },
      {
        letter: "E",
        name: "Evolution",
        flag: abcde.evolution,
        description: "Changing in size, shape, or color",
        notes: abcde.evolutionNotes,
      },
    ];

    return (
      <View className="mt-4">
        <Text className="font-medium text-slate-800 dark:text-white mb-2">
          ABCDE Analysis
        </Text>
        <View className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 p-3">
          {criteria.map((item) => (
            <View
              key={item.letter}
              className="flex-row items-start py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
            >
              <View
                className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                  item.flag
                    ? "bg-red-100 dark:bg-red-900/30"
                    : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                <Text
                  className={`font-bold ${
                    item.flag
                      ? "text-red-700 dark:text-red-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {item.letter}
                </Text>
              </View>
              <View className="flex-1">
                <View className="flex-row justify-between items-center">
                  <Text className="font-medium text-slate-800 dark:text-white">
                    {item.name}
                  </Text>
                  {item.score !== undefined && (
                    <Text
                      className={`text-xs ${
                        item.flag
                          ? "text-red-700 dark:text-red-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {Math.round(item.score * 100)}%
                    </Text>
                  )}
                  {item.value !== undefined && (
                    <Text
                      className={`text-xs ${
                        item.flag
                          ? "text-red-700 dark:text-red-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {item.value} mm
                    </Text>
                  )}
                </View>
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {item.description}
                </Text>
                {item.notes && (
                  <Text className="text-xs italic text-gray-500 dark:text-gray-400 mt-1">
                    "{item.notes}"
                  </Text>
                )}
              </View>
            </View>
          ))}
          <View className="mt-2 flex-row items-center">
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              Total flags: {abcde.totalFlags}/5
            </Text>
            <Text className="text-xs ml-auto text-gray-500 dark:text-gray-400">
              {abcde.totalFlags >= 3
                ? "Higher concern"
                : abcde.totalFlags >= 1
                ? "Monitor"
                : "Low concern"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  /**
   * Renders the case details tab content
   */
  const renderDetailsTab = () => {
    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <View className="mt-4">
          <Text className="font-medium text-slate-800 dark:text-white mb-2">
            {i18n.t("result.caseOverview")}
          </Text>
          <View className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 p-4">
            <View className="flex-row justify-between items-center">
              <Text className="text-slate-600 dark:text-slate-300">
                {i18n.t("result.caseNumber")}
              </Text>
              <Text className="font-medium text-slate-800 dark:text-white">
                {caseDetail?.caseNumber}
              </Text>
            </View>
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-slate-600 dark:text-slate-300">
                {i18n.t("result.date")}
              </Text>
              <Text className="text-slate-800 dark:text-white">
                {caseDetail?.formattedDate}
              </Text>
            </View>
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-slate-600 dark:text-slate-300">
                {i18n.t("result.status")}
              </Text>
              <Badge
                className={`${getStatusBadge(caseDetail?.status || "").bg} ${
                  getStatusBadge(caseDetail?.status || "").text
                }`}
              >
                {caseDetail?.status?.replace("_", " ") ||
                  i18n.t("result.unknownStatus")}
              </Badge>
            </View>
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-slate-600 dark:text-slate-300">
                {i18n.t("result.riskLevel.label")}
              </Text>
              <Badge
                className={`${getRiskBadge(caseDetail?.riskLevel || "").bg} ${
                  getRiskBadge(caseDetail?.riskLevel || "").text
                }`}
              >
                {getRiskBadge(caseDetail?.riskLevel || "").label}
              </Badge>
            </View>
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-slate-600 dark:text-slate-300">
                {i18n.t("result.lesionType")}
              </Text>
              <Text className="text-slate-800 dark:text-white">
                {caseDetail?.lesionType?.replace("_", " ") ||
                  i18n.t("result.unknown")}
              </Text>
            </View>
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-slate-600 dark:text-slate-300">
                {i18n.t("result.bodyLocation")}
              </Text>
              <Text className="text-slate-800 dark:text-white">
                {caseDetail?.bodyLocation
                  ? String(caseDetail.bodyLocation)
                      .replace("_", " ")
                      .toLowerCase()
                  : i18n.t("result.unknown")}
              </Text>
            </View>
            {caseDetail?.firstNoticed && (
              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-slate-600 dark:text-slate-300">
                  {i18n.t("result.firstNoticed")}
                </Text>
                <Text className="text-slate-800 dark:text-white">
                  {caseDetail.firstNoticed}
                </Text>
              </View>
            )}
            {caseDetail?.symptoms && (
              <View className="mt-3">
                <Text className="text-slate-600 dark:text-slate-300 mb-1">
                  {i18n.t("result.symptoms")}
                </Text>
                <Text className="text-slate-800 dark:text-white">
                  {caseDetail.symptoms}
                </Text>
              </View>
            )}
            {caseDetail?.diagnosis && (
              <View className="mt-3">
                <Text className="text-slate-600 dark:text-slate-300 mb-1">
                  {i18n.t("result.diagnosis")}
                </Text>
                <Text className="text-slate-800 dark:text-white">
                  {caseDetail.diagnosis}
                </Text>
              </View>
            )}
          </View>
        </View>
        {caseDetail?.nextAppointment && (
          <View className="mt-6">
            <Text className="font-medium text-slate-800 dark:text-white mb-2">
              {i18n.t("result.upcomingAppointment")}
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/appointments",
                  params: { id: caseDetail.nextAppointment?.id },
                })
              }
              className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 p-4"
            >
              <View className="flex-row items-center">
                <View className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 items-center justify-center mr-3">
                  <Feather
                    name="calendar"
                    size={18}
                    color={isDarkColorScheme ? "#93c5fd" : "#3b82f6"}
                  />
                </View>
                <View>
                  <Text className="font-medium text-slate-800 dark:text-white">
                    {caseDetail.nextAppointment.doctor.name}
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    {caseDetail.nextAppointment.type.replace("_", " ")}
                  </Text>
                </View>
                <View className="ml-auto">
                  <Text className="text-right font-medium text-slate-800 dark:text-white">
                    {caseDetail.nextAppointment.formattedDate}
                  </Text>
                  <Text className="text-right text-xs text-slate-500 dark:text-slate-400">
                    {caseDetail.nextAppointment.formattedTime}
                  </Text>
                </View>
              </View>
              {caseDetail.nextAppointment.location && (
                <View className="mt-2 flex-row items-center">
                  <Feather
                    name="map-pin"
                    size={12}
                    color={isDarkColorScheme ? "#94a3b8" : "#64748b"}
                  />
                  <Text className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                    {caseDetail.nextAppointment.location}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
        <View className="mt-6 mb-8">
          <Button
            variant="outline"
            className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            textClassName="text-red-500 dark:text-red-400"
            onPress={handleDeleteCase}
            disabled={deletingCase}
          >
            {deletingCase ? (
              <View className="flex-row items-center">
                <ActivityIndicator
                  size="small"
                  color={isDarkColorScheme ? "#ef4444" : "#dc2626"}
                />
                <Text className="ml-2 text-red-500 dark:text-red-400">
                  {i18n.t("result.deleting")}
                </Text>
              </View>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                <Text>{i18n.t("result.deleteCase")}</Text>
              </>
            )}
          </Button>
          <Text className="text-xs text-center mt-2 text-slate-500 dark:text-slate-400">
            {i18n.t("result.deleteWarning")}
          </Text>
        </View>
        {!caseDetail?.nextAppointment && (
          <Button
            onPress={() => router.push("/appointments")}
            className="mt-6 bg-teal-500"
          >
            {i18n.t("result.findDoctor")}
          </Button>
        )}
      </Animated.View>
    );
  };

  /**
   * Renders the analysis tab content
   */
  const renderAnalysisTab = () => {
    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Analysis Results */}
        {caseDetail?.latestAnalysis ? (
          <>
            <View className="mt-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="font-medium text-slate-800 dark:text-white">
                  Analysis Results
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  {caseDetail.latestAnalysis.formattedDate}
                </Text>
              </View>

              <View className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 p-4">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    {caseDetail.latestAnalysis.reviewedByDoctor ? (
                      <View className="bg-blue-100 dark:bg-blue-900/30 w-8 h-8 rounded-full items-center justify-center mr-2">
                        <FontAwesome5
                          name="user-md"
                          size={14}
                          color={isDarkColorScheme ? "#93c5fd" : "#3b82f6"}
                        />
                      </View>
                    ) : (
                      <View className="bg-purple-100 dark:bg-purple-900/30 w-8 h-8 rounded-full items-center justify-center mr-2">
                        <FontAwesome5
                          name="robot"
                          size={14}
                          color={isDarkColorScheme ? "#c4b5fd" : "#8b5cf6"}
                        />
                      </View>
                    )}
                    <View>
                      <Text className="font-medium text-slate-800 dark:text-white">
                        {caseDetail.latestAnalysis.analyst.name}
                      </Text>
                      <Text className="text-xs text-slate-500 dark:text-slate-400">
                        {caseDetail.latestAnalysis.analyst.role === "SYSTEM"
                          ? "AI Analysis"
                          : caseDetail.latestAnalysis.analyst.role.replace(
                              "_",
                              " "
                            )}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center">
                    <Text className="mr-2 text-xs text-slate-500 dark:text-slate-400">
                      Confidence:
                    </Text>
                    <View className="bg-gray-200 dark:bg-gray-700 h-2 w-16 rounded-full overflow-hidden">
                      <View
                        className="bg-teal-500 dark:bg-teal-400 h-full rounded-full"
                        style={{
                          width: `${caseDetail.latestAnalysis.confidence}%`,
                        }}
                      />
                    </View>
                    <Text className="ml-1 text-xs text-slate-800 dark:text-white">
                      {Math.round(caseDetail.latestAnalysis.confidence)}%
                    </Text>
                  </View>
                </View>

                {/* Observations */}
                {caseDetail.latestAnalysis.observations && (
                  <View className="mt-4">
                    <Text className="font-medium text-slate-800 dark:text-white mb-1">
                      Observations
                    </Text>
                    <Text className="text-slate-600 dark:text-slate-300">
                      {caseDetail.latestAnalysis.observations}
                    </Text>
                  </View>
                )}

                {/* Recommendations */}
                {caseDetail.latestAnalysis.recommendations && (
                  <View className="mt-4">
                    <Text className="font-medium text-slate-800 dark:text-white mb-1">
                      Recommendations
                    </Text>
                    <Text className="text-slate-600 dark:text-slate-300">
                      {caseDetail.latestAnalysis.recommendations}
                    </Text>
                  </View>
                )}

                {/* Doctor Notes */}
                {caseDetail.latestAnalysis.reviewedByDoctor &&
                  caseDetail.latestAnalysis.doctorNotes && (
                    <View className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Text className="font-medium text-slate-800 dark:text-white mb-1">
                        Doctor's Notes
                      </Text>
                      <Text className="text-slate-600 dark:text-slate-300">
                        {caseDetail.latestAnalysis.doctorNotes}
                      </Text>
                    </View>
                  )}
              </View>
            </View>

            {/* ABCDE Criteria */}
            {renderABCDECriteria()}
          </>
        ) : (
          <View className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 p-4 items-center justify-center py-8">
            <Feather
              name="activity"
              size={48}
              color={isDarkColorScheme ? "#64748b" : "#94a3b8"}
            />
            <Text className="mt-4 text-center text-slate-600 dark:text-slate-400">
              No analysis results available for this case.
            </Text>
          </View>
        )}

        {/* Similar Cases - moved from Treatment tab */}
        {caseDetail?.latestAnalysis?.similarCases &&
          caseDetail.latestAnalysis.similarCases.length > 0 && (
            <View className="mt-6">
              <Text className="font-medium text-slate-800 dark:text-white mb-2">
                Similar Cases
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {caseDetail.latestAnalysis.similarCases.map((similar) => (
                  <Card key={similar.id} className="mr-3 w-40">
                    <View className="p-2">
                      <Image
                        source={{ uri: similar.imageUrl }}
                        style={{ width: "100%", height: 100 }}
                        resizeMode="cover"
                        className="rounded-md"
                      />
                      <Text className="font-medium text-slate-800 dark:text-white mt-2 text-xs">
                        {similar.caseNumber}
                      </Text>
                      <Text className="text-xs text-slate-500 dark:text-slate-400">
                        {similar.diagnosis}
                      </Text>
                      <Badge
                        className={`mt-2 ${
                          getRiskBadge(similar.riskLevel).bg
                        } ${getRiskBadge(similar.riskLevel).text}`}
                      >
                        <Text className="text-xs">
                          {getRiskBadge(similar.riskLevel).label}
                        </Text>
                      </Badge>
                    </View>
                  </Card>
                ))}
              </ScrollView>
            </View>
          )}
      </Animated.View>
    );
  };

  const handleDeleteCase = async (): Promise<void> => {
    Alert.alert(
      "Delete Case",
      "Are you sure you want to delete this case? This action cannot be undone and will delete all associated images and analysis results.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingCase(true);

              const token = await SecureStore.getItemAsync("token");
              if (!token) {
                router.replace("/");
                return;
              }

              // Use a direct, simple URL format to avoid path issues
              const response = await fetch(
                `${ENV.API_URL}/api/mobile/result/${params.id}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                  },
                }
              );

              // Try to ensure JSON parsing works even with error responses
              const contentType = response.headers.get("content-type");
              let data;
              if (contentType && contentType.includes("application/json")) {
                data = await response.json();
              } else {
                const text = await response.text();
                console.error("Non-JSON response:", text);
                throw new Error("Server returned a non-JSON response");
              }

              if (!response.ok) {
                throw new Error(data.error || "Failed to delete case");
              }

              // Show success message
              Alert.alert("Success", "Case deleted successfully", [
                {
                  text: "OK",
                  onPress: () => router.replace("/history"),
                },
              ]);
            } catch (error) {
              console.error("Error deleting case:", error);
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Failed to delete case. Please try again."
              );
            } finally {
              setDeletingCase(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      className="flex-1 bg-teal-50 dark:bg-slate-900"
      edges={["top"]}
    >
      <Stack.Screen
        options={{
          title: caseDetail?.caseNumber || i18n.t("result.detailsTitle"),
          headerStyle: {
            backgroundColor: isDarkColorScheme ? "#0f172a" : "#f0fdfa",
          },
          headerTintColor: isDarkColorScheme ? "#f8fafc" : "#0f172a",
        }}
      />
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator
            size="large"
            color={isDarkColorScheme ? "#0ea5e9" : "#0284c7"}
          />
          <Text className="mt-4 text-slate-600 dark:text-slate-400">
            {i18n.t("result.loading")}
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
            onPress={() => fetchCaseDetail()}
            className="mt-4"
            variant="primary"
          >
            {i18n.t("result.tryAgain")}
          </Button>
        </View>
      ) : (
        <ScrollView
          className="flex-1 p-4"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {caseDetail?.riskLevel && (
            <View
              className={`${
                getRiskBadge(caseDetail.riskLevel).bg
              } p-3 rounded-lg mb-4 flex-row items-center justify-between`}
            >
              <View className="flex-row items-center">
                <Feather
                  name={
                    caseDetail.riskLevel === RiskLevel.LOW
                      ? "check-circle"
                      : caseDetail.riskLevel === RiskLevel.MEDIUM
                      ? "alert-circle"
                      : "alert-triangle"
                  }
                  size={20}
                  color={getRiskBadge(caseDetail.riskLevel).color}
                />
                <Text
                  className={`ml-2 font-medium ${
                    getRiskBadge(caseDetail.riskLevel).text
                  }`}
                >
                  {getRiskBadge(caseDetail.riskLevel).label}
                </Text>
              </View>
              {caseDetail.latestAnalysis?.reviewedByDoctor && (
                <View className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  <Text className="text-xs text-blue-700 dark:text-blue-400">
                    {i18n.t("result.doctorReviewed")}
                  </Text>
                </View>
              )}
            </View>
          )}
          {renderImageGallery()}
          <View className="flex-row border-b border-gray-200 dark:border-gray-700 mt-6">
            <TouchableOpacity
              onPress={() => changeTab("details")}
              className={`flex-1 py-2 ${
                activeTab === "details"
                  ? "border-b-2 border-teal-500 dark:border-teal-400"
                  : ""
              }`}
            >
              <Text
                className={`text-center text-sm ${
                  activeTab === "details"
                    ? "font-medium text-teal-600 dark:text-teal-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {i18n.t("result.tab.details")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => changeTab("analysis")}
              className={`flex-1 py-2 ${
                activeTab === "analysis"
                  ? "border-b-2 border-teal-500 dark:border-teal-400"
                  : ""
              }`}
            >
              <Text
                className={`text-center text-sm ${
                  activeTab === "analysis"
                    ? "font-medium text-teal-600 dark:text-teal-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {i18n.t("result.tab.analysis")}
              </Text>
            </TouchableOpacity>
          </View>
          {activeTab === "details" && renderDetailsTab()}
          {activeTab === "analysis" && renderAnalysisTab()}
          <View className="h-8" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
