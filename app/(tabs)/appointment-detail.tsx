import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  Alert,
  Linking,
  TouchableOpacity,
  Platform,
  GestureResponderEvent,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Avatar } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import ENV from "~/lib/env";

import { Feather, Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "~/lib/useColorScheme";
import * as SecureStore from "expo-secure-store";
import {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  StatusBadgeStyle,
  AppointmentApiResponse,
} from "~/types/mobile-api";

export default function AppointmentDetailScreen(): React.ReactNode {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelingAppointment, setCancelingAppointment] =
    useState<boolean>(false);
  const [joiningVideoCall, setJoiningVideoCall] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      fetchAppointmentDetails();
    } else {
      setError("No appointment ID provided");
      setLoading(false);
    }
  }, [id]);

  const fetchAppointmentDetails = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        router.replace("/");
        return;
      }

      if (!id) {
        throw new Error("No appointment ID provided");
      }

      const response = await fetch(
        `${ENV.API_URL}/api/mobile/appointments/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data: AppointmentApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.success === false
            ? (data.data as unknown as string)
            : "Failed to fetch appointment details"
        );
      }

      setAppointment(data.data);
    } catch (error: unknown) {
      console.error("Error fetching appointment details:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load appointment details"
      );
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (): Promise<void> => {
    try {
      Alert.alert(
        "Cancel Appointment",
        "Are you sure you want to cancel this appointment?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes, Cancel",
            style: "destructive",
            onPress: async (): Promise<void> => {
              setCancelingAppointment(true);

              const token = await SecureStore.getItemAsync("token");
              if (!token) {
                router.replace("/");
                return;
              }

              if (!id) {
                throw new Error("No appointment ID provided");
              }

              const response = await fetch(
                `${ENV.API_URL}/api/mobile/appointments/${id}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || "Failed to cancel appointment");
              }

              Alert.alert("Success", "Appointment canceled successfully", [
                {
                  text: "OK",
                  onPress: (): void => router.push("/appointments"),
                },
              ]);
            },
          },
        ]
      );
    } catch (error: unknown) {
      console.error("Error canceling appointment:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to cancel appointment. Please try again."
      );
    } finally {
      setCancelingAppointment(false);
    }
  };

  const joinVideoCall = async (): Promise<void> => {
    if (!appointment || appointment.status !== AppointmentStatus.CONFIRMED) {
      Alert.alert(
        "Cannot Join Call",
        "You can only join video calls for confirmed appointments."
      );
      return;
    }

    try {
      setJoiningVideoCall(true);

      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        router.replace("/");
        return;
      }

      // Get or create a video call room
      const response = await fetch(`${ENV.API_URL}/api/mobile/video-calls`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointmentId: id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create video call room");
      }

      const { roomId } = data;

      // Navigate to the video call screen
      router.push({
        pathname: "/video",
        params: {
          roomId,
          appointmentId: id,
          doctorName: appointment.doctor.name,
          doctorImage: appointment.doctor.image || "",
        },
      });
    } catch (error: unknown) {
      console.error("Error joining video call:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to join video call. Please try again."
      );
    } finally {
      setJoiningVideoCall(false);
    }
  };

  const getStatusBadge = (status: string): StatusBadgeStyle => {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return {
          bg: isDarkColorScheme ? "bg-green-900/30" : "bg-green-100",
          text: isDarkColorScheme ? "text-green-400" : "text-green-700",
          label: "Confirmed",
        };
      case AppointmentStatus.REQUESTED:
        return {
          bg: isDarkColorScheme ? "bg-yellow-900/30" : "bg-yellow-100",
          text: isDarkColorScheme ? "text-yellow-400" : "text-yellow-700",
          label: "Pending",
        };
      case AppointmentStatus.COMPLETED:
        return {
          bg: isDarkColorScheme ? "bg-blue-900/30" : "bg-blue-100",
          text: isDarkColorScheme ? "text-blue-400" : "text-blue-700",
          label: "Completed",
        };
      case AppointmentStatus.CANCELED:
        return {
          bg: isDarkColorScheme ? "bg-red-900/30" : "bg-red-100",
          text: isDarkColorScheme ? "text-red-400" : "text-red-700",
          label: "Canceled",
        };
      case AppointmentStatus.RESCHEDULED:
        return {
          bg: isDarkColorScheme ? "bg-purple-900/30" : "bg-purple-100",
          text: isDarkColorScheme ? "text-purple-400" : "text-purple-700",
          label: "Rescheduled",
        };
      default:
        return {
          bg: isDarkColorScheme ? "bg-gray-800" : "bg-gray-100",
          text: isDarkColorScheme ? "text-gray-400" : "text-gray-700",
          label: status.replace("_", " "),
        };
    }
  };

  const openMap = (location: string): void => {
    const query = encodeURIComponent(location);

    if (Platform.OS === "ios") {
      Linking.openURL(`maps://0,0?q=${query}`);
    } else {
      Linking.openURL(`geo:0,0?q=${query}`);
    }
  };

  const callDoctor = (phone: string): void => {
    if (!phone) {
      Alert.alert(
        "No phone number",
        "This doctor doesn't have a phone number listed."
      );
      return;
    }

    Linking.openURL(`tel:${phone}`);
  };

  // Helper function to format the date relative to now
  const getRelativeTimeString = (date: Date): string => {
    const now = new Date();
    const apptDate = new Date(date);
    const diffInMilliseconds = apptDate.getTime() - now.getTime();
    const diffInDays = Math.ceil(diffInMilliseconds / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return "Today";
    } else if (diffInDays === 1) {
      return "Tomorrow";
    } else if (diffInDays > 0 && diffInDays < 7) {
      return `In ${diffInDays} days`;
    } else if (diffInDays < 0 && diffInDays > -7) {
      return `${Math.abs(diffInDays)} days ago`;
    } else {
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
        <Stack.Screen
          options={{
            title: "Appointment Details",
            headerShadowVisible: false,
            headerStyle: {
              backgroundColor: isDarkColorScheme ? "#0f172a" : "#f8fafc",
            },
            headerTintColor: isDarkColorScheme ? "#ffffff" : "#0f172a",
          }}
        />

        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator
            size="large"
            color={isDarkColorScheme ? "#0ea5e9" : "#0284c7"}
          />
          <Text className="mt-4 text-slate-600 dark:text-slate-400">
            Loading appointment details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
        <Stack.Screen
          options={{
            title: "Appointment Details",
            headerShadowVisible: false,
            headerStyle: {
              backgroundColor: isDarkColorScheme ? "#0f172a" : "#f8fafc",
            },
            headerTintColor: isDarkColorScheme ? "#ffffff" : "#0f172a",
          }}
        />

        <View className="flex-1 items-center justify-center p-6">
          <Feather
            name="alert-circle"
            size={48}
            color={isDarkColorScheme ? "#ef4444" : "#dc2626"}
          />
          <Text className="mt-4 text-center text-slate-600 dark:text-slate-400">
            {error}
          </Text>
          <Button onPress={fetchAppointmentDetails} className="mt-4">
            Try Again
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
        <Stack.Screen
          options={{
            title: "Appointment Details",
            headerShadowVisible: false,
            headerStyle: {
              backgroundColor: isDarkColorScheme ? "#0f172a" : "#f8fafc",
            },
            headerTintColor: isDarkColorScheme ? "#ffffff" : "#0f172a",
          }}
        />

        <View className="flex-1 items-center justify-center p-6">
          <Feather
            name="calendar"
            size={48}
            color={isDarkColorScheme ? "#64748b" : "#94a3b8"}
          />
          <Text className="mt-4 text-center text-slate-800 dark:text-white font-medium">
            Appointment Not Found
          </Text>
          <Text className="mt-2 text-center text-slate-600 dark:text-slate-400">
            We couldn't find the appointment you're looking for.
          </Text>
          <Button onPress={() => router.push("/appointments")} className="mt-4">
            Back to Appointments
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const isPastAppointment: boolean =
    new Date(appointment.date) < new Date() ||
    appointment.status === AppointmentStatus.CANCELED ||
    appointment.status === AppointmentStatus.COMPLETED;

  const isVideoConsultation: boolean =
    appointment.type === AppointmentType.VIDEO_CONSULTATION;

  // Now we can render the completed appointment details screen
  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
      <Stack.Screen
        options={{
          title: "Appointment Details",
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: isDarkColorScheme ? "#0f172a" : "#f8fafc",
          },
          headerTintColor: isDarkColorScheme ? "#ffffff" : "#0f172a",
        }}
      />

      <ScrollView
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchAppointmentDetails}
            colors={[isDarkColorScheme ? "#0ea5e9" : "#0284c7"]}
          />
        }
      >
        {/* Status Badge */}
        <View className="items-center mb-4">
          <Badge
            className={`${getStatusBadge(appointment.status).bg} ${
              getStatusBadge(appointment.status).text
            } px-4 py-1`}
          >
            {getStatusBadge(appointment.status).label}
          </Badge>
        </View>

        {/* Doctor Information Card */}
        <Card className="mb-4 border border-gray-200 dark:border-gray-700">
          <View className="p-4">
            <View className="flex-row items-center">
              <Avatar
                source={appointment.doctor.image}
                fallback={appointment.doctor.name.substring(0, 2)}
                size="lg"
                className="mr-4"
              />
              <View className="flex-1">
                <Text className="text-lg font-bold text-slate-800 dark:text-white">
                  {appointment.doctor.name}
                </Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {appointment.doctor.role.replace("_", " ")}
                </Text>
                {appointment.doctor.specialties &&
                  appointment.doctor.specialties.length > 0 && (
                    <Text className="text-sm text-teal-600 dark:text-teal-400">
                      {appointment.doctor.specialties.join(", ")}
                    </Text>
                  )}
              </View>
            </View>
          </View>
        </Card>

        {/* Appointment Details Card */}
        <Card className="mb-4 border border-gray-200 dark:border-gray-700">
          <View className="p-4">
            <Text className="text-lg font-bold text-slate-800 dark:text-white mb-3">
              Appointment Details
            </Text>

            <View className="space-y-4">
              {/* Date & Time */}
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/20 items-center justify-center mr-3">
                  <Feather name="calendar" size={20} color="#00c4b4" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    Date & Time
                  </Text>
                  <Text className="text-base font-medium text-slate-800 dark:text-white">
                    {appointment.formattedDate}, {appointment.formattedTime} (
                    {getRelativeTimeString(new Date(appointment.date))})
                  </Text>
                </View>
              </View>

              {/* Appointment Type */}
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/20 items-center justify-center mr-3">
                  {isVideoConsultation ? (
                    <Feather name="video" size={20} color="#818cf8" />
                  ) : (
                    <Feather name="user" size={20} color="#818cf8" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    Appointment Type
                  </Text>
                  <Text className="text-base font-medium text-slate-800 dark:text-white">
                    {appointment.type.replace("_", " ")}
                  </Text>
                </View>
              </View>

              {/* Duration */}
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/20 items-center justify-center mr-3">
                  <Feather name="clock" size={20} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    Duration
                  </Text>
                  <Text className="text-base font-medium text-slate-800 dark:text-white">
                    {appointment.duration} minutes
                  </Text>
                </View>
              </View>

              {/* Location (if available) */}
              {appointment.location && (
                <TouchableOpacity
                  onPress={() => openMap(appointment.location!)}
                  className="flex-row items-center"
                >
                  <View className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/20 items-center justify-center mr-3">
                    <Feather name="map-pin" size={20} color="#10b981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                      Location
                    </Text>
                    <Text className="text-base font-medium text-slate-800 dark:text-white">
                      {appointment.location}
                    </Text>
                  </View>
                  <Feather
                    name="external-link"
                    size={16}
                    color={isDarkColorScheme ? "#94a3b8" : "#64748b"}
                  />
                </TouchableOpacity>
              )}

              {/* Reason for Visit */}
              {appointment.reasonForVisit && (
                <View className="flex-row items-start">
                  <View className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 items-center justify-center mr-3 mt-1">
                    <Feather name="clipboard" size={20} color="#a855f7" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                      Reason for Visit
                    </Text>
                    <Text className="text-base text-slate-800 dark:text-white">
                      {appointment.reasonForVisit}
                    </Text>
                  </View>
                </View>
              )}

              {/* Consultation Fee (if available) */}
              {appointment.consultationFee && (
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 items-center justify-center mr-3">
                    <Feather name="dollar-sign" size={20} color="#059669" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                      Consultation Fee
                    </Text>
                    <Text className="text-base font-medium text-slate-800 dark:text-white">
                      ${appointment.consultationFee}
                    </Text>
                  </View>
                </View>
              )}

              {/* Case information (if available) */}
              {appointment.case && (
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 items-center justify-center mr-3">
                    <Feather name="file-text" size={20} color="#ef4444" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                      Related Case
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="text-base font-medium text-slate-800 dark:text-white mr-2">
                        #{appointment.case.caseNumber}
                      </Text>
                      <Badge
                        className={`${
                          appointment.case.riskLevel === "HIGH"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                            : appointment.case.riskLevel === "MEDIUM"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                            : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                        }`}
                      >
                        {appointment.case.riskLevel}
                      </Badge>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View className="space-y-3 mb-6 flex flex-col gap-2">
          {/* Video Call Button (only for video consultations that are confirmed and not past) */}
          {isVideoConsultation &&
            appointment.status === AppointmentStatus.CONFIRMED &&
            !isPastAppointment && (
              <Button
                onPress={joinVideoCall}
                disabled={joiningVideoCall}
                className="bg-teal-500"
              >
                {joiningVideoCall ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#fff" />
                    <Text className="text-white ml-2">Joining Call...</Text>
                  </View>
                ) : (
                  <View className="flex-row items-center">
                    <Feather
                      name="video"
                      size={18}
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                    <Text>Join Video Call</Text>
                  </View>
                )}
              </Button>
            )}

          {/* Call Doctor Button */}
          {appointment.doctor.phoneNumber && (
            <Button
              variant="outline"
              onPress={() => callDoctor(appointment.doctor.phoneNumber!)}
              className="border-indigo-200 dark:border-indigo-800"
            >
              <View className="flex-row items-center">
                <Feather
                  name="phone"
                  size={18}
                  color={isDarkColorScheme ? "#818cf8" : "#6366f1"}
                  style={{ marginRight: 8 }}
                />
                <Text className="text-indigo-600 dark:text-indigo-400">
                  Call Doctor
                </Text>
              </View>
            </Button>
          )}

          {/* Message Button */}
          <Button
            variant="outline"
            onPress={() => router.push(`/chat/${appointment.doctor.id}`)}
            className="border-blue-200 dark:border-blue-800"
          >
            <View className="flex-row items-center">
              <Feather
                name="message-circle"
                size={18}
                color={isDarkColorScheme ? "#60a5fa" : "#3b82f6"}
                style={{ marginRight: 8 }}
              />
              <Text className="text-blue-600 dark:text-blue-400">
                Message Doctor
              </Text>
            </View>
          </Button>

          {/* Cancel Button (only for non-past and non-completed appointments) */}
          {!isPastAppointment &&
            appointment.status !== AppointmentStatus.COMPLETED &&
            appointment.status !== AppointmentStatus.CANCELED && (
              <Button
                variant="outline"
                onPress={cancelAppointment}
                disabled={cancelingAppointment}
                className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
              >
                {cancelingAppointment ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator
                      size="small"
                      color={isDarkColorScheme ? "#f87171" : "#ef4444"}
                    />
                    <Text className="text-red-600 dark:text-red-400 ml-2">
                      Canceling...
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center">
                    <Feather
                      name="x"
                      size={18}
                      color={isDarkColorScheme ? "#f87171" : "#ef4444"}
                      style={{ marginRight: 8 }}
                    />
                    <Text className="text-red-600 dark:text-red-400">
                      Cancel Appointment
                    </Text>
                  </View>
                )}
              </Button>
            )}
        </View>

        {/* Notes (if any) */}
        {appointment.notes && (
          <Card className="mb-4 border border-gray-200 dark:border-gray-700">
            <View className="p-4">
              <Text className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                Notes
              </Text>
              <Text className="text-slate-700 dark:text-slate-300">
                {appointment.notes}
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
