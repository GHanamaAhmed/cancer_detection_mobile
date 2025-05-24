import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { Card } from "~/components/ui/card";
import ENV from "~/lib/env";

import { Button } from "~/components/ui/button";
import { Avatar } from "~/components/ui/avatar";
import { ThemeToggle } from "~/components/theme-toggle";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "~/lib/useColorScheme";
import { router, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Badge } from "~/components/ui/badge";
import { Tabs } from "~/components/ui/tabs";
import { Doctor, AvailabilityDate, Appointment } from "~/types/mobile-api";

const { width } = Dimensions.get("window");

export default function AppointmentsScreen() {
  const { isDarkColorScheme } = useColorScheme();
  const [activeTab, setActiveTab] = useState<"upcoming" | "book" | "past">(
    "upcoming"
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Booking states
  const [showBooking, setShowBooking] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [availabilityDates, setAvailabilityDates] = useState<
    AvailabilityDate[]
  >([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<
    "IN_PERSON" | "VIDEO_CONSULTATION"
  >("IN_PERSON");
  const [reasonForVisit, setReasonForVisit] = useState("");
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Appointment lists
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    Appointment[]
  >([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toLocaleDateString("en-US", { month: "long" })
  );

  // Calculate months for the month selector
  const getMonths = () => {
    const months = [];
    const today = new Date();

    // If we're near the end of the month, start with next month
    const isEndOfMonth = today.getDate() > 25;
    const startMonth = isEndOfMonth ? today.getMonth() + 1 : today.getMonth();

    // Add current month (or next month if end of month) and 5 more months
    for (let i = 0; i < 6; i++) {
      const month = new Date(today.getFullYear(), startMonth + i, 1);
      months.push(month.toLocaleDateString("en-US", { month: "long" }));
    }

    return months;
  };

  const months = getMonths();

  // Fetch upcoming appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        router.replace("/");
        return;
      }

      const response = await fetch(`${ENV.API_URL}/api/mobile/appointments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch appointments");
      }

      const now = new Date();
      const upcoming = data.data.filter(
        (appt: Appointment) =>
          new Date(appt.date) >= now &&
          appt.status !== "CANCELED" &&
          appt.status != "COMPLETED"
      );
      const past = data.data.filter(
        (appt: Appointment) =>
          new Date(appt.date) < now ||
          appt.status === "CANCELED" ||
          appt.status === "COMPLETED"
      );

      setUpcomingAppointments(upcoming);
      setPastAppointments(past);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load appointments"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch connected doctors
  const fetchConnectedDoctors = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        router.replace("/");
        return;
      }

      const response = await fetch(
        `${ENV.API_URL}/api/mobile/doctors/connected`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch connected doctors");
      }

      setDoctors(data.data);

      // Check if we have connected doctors
      if (data.data.length === 0) {
        Alert.alert(
          "No Connected Doctors",
          "You don't have any connected doctors yet. Connect with doctors first to book appointments.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Find Doctors",
              onPress: () => router.push("/doctors"),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error fetching connected doctors:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load doctors"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch doctor's availability
  const fetchDoctorAvailability = async (doctorId: string) => {
    try {
      setLoading(true);
      setError(null);

      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        router.replace("/");
        return;
      }

      // Get the first day of the selected month
      const monthIndex = months.indexOf(selectedMonth);
      const today = new Date();

      // Create date for the first day of the selected month
      const startDate = new Date(
        today.getFullYear(),
        today.getMonth() + monthIndex,
        1
      );

      // Create date for the last day of the selected month
      const endDate = new Date(
        today.getFullYear(),
        today.getMonth() + monthIndex + 1,
        0
      );

      console.log("Fetching availability:", {
        doctorId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const response = await fetch(
        `${
          ENV.API_URL
        }/api/mobile/doctors/availability?doctorId=${doctorId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch doctor availability");
      }

      console.log("Received availability data:", data.data);

      // If we got availability data but it's empty, try expanding the date range
      if (data.data && data.data.length === 0 && monthIndex === 0) {
        // Try to get next month's data as well for the current month
        const expandedEndDate = new Date(
          today.getFullYear(),
          today.getMonth() + 2,
          0
        );

        const expandedResponse = await fetch(
          `${
            ENV.API_URL
          }/api/mobile/doctors/availability?doctorId=${doctorId}&startDate=${startDate.toISOString()}&endDate=${expandedEndDate.toISOString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const expandedData = await expandedResponse.json();
        if (expandedResponse.ok && expandedData.data.length > 0) {
          setAvailabilityDates(expandedData.data);
        } else {
          setAvailabilityDates(data.data);
        }
      } else {
        setAvailabilityDates(data.data);
      }

      // Reset selected date and slot
      setSelectedDate(null);
      setSelectedSlot(null);
    } catch (error) {
      console.error("Error fetching doctor availability:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load availability"
      );
    } finally {
      setLoading(false);
    }
  };

  // Book appointment
  const bookAppointment = async () => {
    try {
      if (!selectedDoctor || !selectedSlot || !appointmentType) {
        Alert.alert(
          "Missing Information",
          "Please select all required fields."
        );
        return;
      }

      setBookingInProgress(true);

      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        router.replace("/");
        return;
      }

      const appointmentData = {
        doctorId: selectedDoctor.id,
        date: selectedSlot,
        type: appointmentType,
        reasonForVisit: reasonForVisit,
        location: selectedDoctor.location,
      };

      const response = await fetch(`${ENV.API_URL}/api/mobile/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(appointmentData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to book appointment");
      }

      Alert.alert(
        "Appointment Requested",
        "Your appointment request has been sent to the doctor. You'll be notified once it's confirmed.",
        [{ text: "OK" }]
      );

      // Reset booking form and go back to appointment list
      resetBookingForm();
      setActiveTab("upcoming");
      fetchAppointments();
    } catch (error) {
      console.error("Error booking appointment:", error);
      Alert.alert(
        "Booking Failed",
        error instanceof Error
          ? error.message
          : "Failed to book appointment. Please try again."
      );
    } finally {
      setBookingInProgress(false);
    }
  };

  // Reset booking form
  const resetBookingForm = () => {
    setStep(1);
    setSelectedDoctor(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setAppointmentType("IN_PERSON");
    setReasonForVisit("");
    setAvailabilityDates([]);
    setShowBooking(false);
  };

  // Cancel appointment
  const cancelAppointment = async (appointmentId: string) => {
    try {
      Alert.alert(
        "Cancel Appointment",
        "Are you sure you want to cancel this appointment?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes, Cancel",
            style: "destructive",
            onPress: async () => {
              setLoading(true);

              const token = await SecureStore.getItemAsync("token");
              if (!token) {
                router.replace("/");
                return;
              }

              const response = await fetch(
                `${ENV.API_URL}/api/mobile/appointments/${appointmentId}`,
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

              Alert.alert("Success", "Appointment canceled successfully");
              fetchAppointments();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error canceling appointment:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to cancel appointment. Please try again."
      );
      setLoading(false);
    }
  };

  // Load data when tab changes
  useFocusEffect(
    useCallback(() => {
      if (activeTab === "upcoming" || activeTab === "past") {
        fetchAppointments();
      } else if (activeTab === "book" && !selectedDoctor) {
        fetchConnectedDoctors();
      }
    }, [activeTab])
  );
  // Add this useEffect to ensure fetchDoctorAvailability is called when the component mounts
  useEffect(() => {
    if (selectedDoctor && activeTab === "book" && step === 2) {
      fetchDoctorAvailability(selectedDoctor.id);
    }
  }, [selectedDoctor, activeTab, step]);
  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    if (activeTab === "upcoming" || activeTab === "past") {
      fetchAppointments();
    } else if (activeTab === "book") {
      if (selectedDoctor) {
        fetchDoctorAvailability(selectedDoctor.id);
      } else {
        fetchConnectedDoctors();
      }
    }
  };

  // Handler for doctor selection
  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setStep(2);
    // Reset to first month when selecting a new doctor
    setSelectedMonth(months[0]);
    fetchDoctorAvailability(doctor.id);
  };

  // Handler for date selection
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  // Handler for time slot selection
  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    setStep(3);
  };

  // Handler for appointment type selection
  const handleTypeSelect = (type: "IN_PERSON" | "VIDEO_CONSULTATION") => {
    setAppointmentType(type);
  };

  // Render appointment card
  const renderAppointmentCard = (appointment: Appointment) => {
    const isPast =
      new Date(appointment.date) < new Date() ||
      appointment.status === "CANCELED" ||
      appointment.status === "COMPLETED";

    const getStatusBadge = (status: string) => {
      switch (status) {
        case "CONFIRMED":
          return {
            bg: isDarkColorScheme ? "bg-green-900/30" : "bg-green-100",
            text: isDarkColorScheme ? "text-green-400" : "text-green-700",
            label: "Confirmed",
          };
        case "REQUESTED":
          return {
            bg: isDarkColorScheme ? "bg-yellow-900/30" : "bg-yellow-100",
            text: isDarkColorScheme ? "text-yellow-400" : "text-yellow-700",
            label: "Pending",
          };
        case "COMPLETED":
          return {
            bg: isDarkColorScheme ? "bg-blue-900/30" : "bg-blue-100",
            text: isDarkColorScheme ? "text-blue-400" : "text-blue-700",
            label: "Completed",
          };
        case "CANCELED":
          return {
            bg: isDarkColorScheme ? "bg-red-900/30" : "bg-red-100",
            text: isDarkColorScheme ? "text-red-400" : "text-red-700",
            label: "Canceled",
          };
        case "RESCHEDULED":
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

    const getTypeIcon = (type: string) => {
      switch (type) {
        case "IN_PERSON":
          return (
            <Feather
              name="user"
              size={14}
              color={isDarkColorScheme ? "#94a3b8" : "#64748b"}
            />
          );
        case "VIDEO_CONSULTATION":
          return (
            <Feather
              name="video"
              size={14}
              color={isDarkColorScheme ? "#94a3b8" : "#64748b"}
            />
          );
        case "FOLLOW_UP":
          return (
            <Feather
              name="repeat"
              size={14}
              color={isDarkColorScheme ? "#94a3b8" : "#64748b"}
            />
          );
        default:
          return (
            <Feather
              name="calendar"
              size={14}
              color={isDarkColorScheme ? "#94a3b8" : "#64748b"}
            />
          );
      }
    };

    return (
      <TouchableOpacity
        className="mb-4"
        onPress={() => {
          router.push(`/appointment-detail?id=${appointment.id}`);
        }}
      >
        <Card className="border border-gray-200 dark:border-gray-700">
          <View className="p-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Avatar
                  source={appointment.doctor.image}
                  fallback={appointment.doctor.name.substring(0, 2)}
                  size="md"
                  className="mr-3"
                />
                <View>
                  <Text className="font-medium text-slate-800 dark:text-white">
                    {appointment.doctor.name}
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    {appointment.doctor.role.replace("_", " ")}
                  </Text>
                </View>
              </View>
              <Badge
                className={`${getStatusBadge(appointment.status).bg} ${
                  getStatusBadge(appointment.status).text
                }`}
              >
                {getStatusBadge(appointment.status).label}
              </Badge>
            </View>

            <View className="flex-row items-center border-y border-gray-100 dark:border-gray-700 py-3">
              <View className="flex-1 flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/20 items-center justify-center mr-2">
                  <Feather name="calendar" size={16} color="#00c4b4" />
                </View>
                <View>
                  <Text className="text-sm font-medium text-slate-800 dark:text-white">
                    {appointment.formattedDate}
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    {appointment.formattedTime}
                  </Text>
                </View>
              </View>

              <View className="flex-1 flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 items-center justify-center mr-2">
                  {getTypeIcon(appointment.type)}
                </View>
                <Text className="text-sm text-gray-700 dark:text-gray-300">
                  {appointment.type.replace("_", " ")}
                </Text>
              </View>
            </View>

            {!isPast && appointment.status !== "CANCELED" && (
              <View className="flex-row justify-between mt-3">
                <Button
                  variant="outline"
                  onPress={() =>
                    router.push(`/appointment-detail?id=${appointment.id}`)
                  }
                  className="flex-1 mr-2"
                >
                  Details
                </Button>
                <Button
                  variant="outline"
                  onPress={() => cancelAppointment(appointment.id)}
                  className="flex-1 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  textClassName="text-red-500 dark:text-red-400"
                >
                  Cancel
                </Button>
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };
  // Render date and time selection
  const renderDateTimeSelection = () => {
    if (loading && !refreshing) {
      return (
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator
            size="large"
            color={isDarkColorScheme ? "#0ea5e9" : "#0284c7"}
          />
          <Text className="mt-4 text-slate-600 dark:text-slate-400">
            Loading availability...
          </Text>
        </View>
      );
    }

    return (
      <View className="p-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => setStep(1)} className="mr-2">
            <Feather
              name="chevron-left"
              size={24}
              color={isDarkColorScheme ? "#fff" : "#334155"}
            />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-slate-800 dark:text-white flex-1">
            Select Date & Time
          </Text>

          {/* Month selection */}
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => {
                const currentIndex = months.indexOf(selectedMonth);
                if (currentIndex > 0) {
                  setSelectedMonth(months[currentIndex - 1]);
                  fetchDoctorAvailability(selectedDoctor!.id);
                }
              }}
              disabled={months.indexOf(selectedMonth) === 0}
              className={
                months.indexOf(selectedMonth) === 0 ? "opacity-30" : ""
              }
            >
              <Feather
                name="chevron-left"
                size={20}
                color={isDarkColorScheme ? "#fff" : "#334155"}
              />
            </TouchableOpacity>

            <Text className="mx-2 text-sm font-medium text-slate-800 dark:text-white">
              {selectedMonth}
            </Text>

            <TouchableOpacity
              onPress={() => {
                const currentIndex = months.indexOf(selectedMonth);
                if (currentIndex < months.length - 1) {
                  setSelectedMonth(months[currentIndex + 1]);
                  fetchDoctorAvailability(selectedDoctor!.id);
                }
              }}
              disabled={months.indexOf(selectedMonth) === months.length - 1}
              className={
                months.indexOf(selectedMonth) === months.length - 1
                  ? "opacity-30"
                  : ""
              }
            >
              <Feather
                name="chevron-right"
                size={20}
                color={isDarkColorScheme ? "#fff" : "#334155"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Doctor info */}
        {selectedDoctor && (
          <View className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 mb-4">
            <View className="flex-row items-center">
              <Avatar
                source={selectedDoctor.image}
                fallback={selectedDoctor.name.substring(0, 2)}
                size="md"
                className="mr-3"
              />
              <View>
                <Text className="font-medium text-slate-800 dark:text-white">
                  {selectedDoctor.name}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedDoctor.role.replace("_", " ")}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Available dates */}
        {availabilityDates.length > 0 ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
            >
              {availabilityDates.map((dateObj) => (
                <TouchableOpacity
                  key={dateObj.date}
                  onPress={() => handleDateSelect(dateObj.date)}
                  className={`mr-3 w-16 h-20 items-center justify-center rounded-xl ${
                    selectedDate === dateObj.date
                      ? "bg-teal-500"
                      : "bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      selectedDate === dateObj.date
                        ? "text-white opacity-80"
                        : "text-slate-800 dark:text-white"
                    }`}
                  >
                    {dateObj.dayOfWeek}
                  </Text>
                  <Text
                    className={`text-xl font-bold mt-1 ${
                      selectedDate === dateObj.date
                        ? "text-white"
                        : "text-slate-800 dark:text-white"
                    }`}
                  >
                    {dateObj.day}
                  </Text>
                  <Text
                    className={`text-xs ${
                      selectedDate === dateObj.date
                        ? "text-white opacity-80"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {dateObj.month}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Available time slots */}
            {selectedDate && (
              <View>
                <Text className="font-medium text-slate-800 dark:text-white mb-2">
                  Available Times
                </Text>

                <View className="flex-row flex-wrap">
                  {availabilityDates
                    .find((d) => d.date === selectedDate)
                    ?.slots.map((slot) => (
                      <TouchableOpacity
                        key={slot.formattedDate}
                        onPress={() => handleSlotSelect(slot.formattedDate)}
                        className={`mr-2 mb-2 px-4 py-2 rounded-lg ${
                          selectedSlot === slot.formattedDate
                            ? "bg-teal-500"
                            : "bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600"
                        }`}
                      >
                        <Text
                          className={`${
                            selectedSlot === slot.formattedDate
                              ? "text-white"
                              : "text-slate-800 dark:text-white"
                          }`}
                        >
                          {slot.time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            )}
          </>
        ) : (
          <View className="items-center justify-center py-8">
            <Feather
              name="calendar"
              size={48}
              color={isDarkColorScheme ? "#64748b" : "#94a3b8"}
            />
            <Text className="mt-4 text-center text-slate-600 dark:text-slate-400">
              No available slots for this doctor in {selectedMonth}.
            </Text>
            <Text className="mt-2 text-center text-slate-500 dark:text-slate-500">
              Try selecting a different month or doctor.
            </Text>
          </View>
        )}

        {/* Continue button */}
        {selectedDate && selectedSlot && (
          <Button onPress={() => setStep(3)} className="mt-6">
            Continue
          </Button>
        )}
      </View>
    );
  };
  // Render doctor selection
  const renderDoctorSelection = () => {
    if (loading && !refreshing) {
      return (
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator
            size="large"
            color={isDarkColorScheme ? "#0ea5e9" : "#0284c7"}
          />
          <Text className="mt-4 text-slate-600 dark:text-slate-400">
            Loading doctors...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className="flex-1 items-center justify-center p-6">
          <Feather
            name="alert-circle"
            size={48}
            color={isDarkColorScheme ? "#ef4444" : "#dc2626"}
          />
          <Text className="mt-4 text-center text-slate-600 dark:text-slate-400">
            {error}
          </Text>
          <Button onPress={() => fetchConnectedDoctors()} className="mt-4">
            Try Again
          </Button>
        </View>
      );
    }

    if (doctors.length === 0) {
      return (
        <View className="flex-1 items-center justify-center p-6">
          <Feather
            name="users"
            size={48}
            color={isDarkColorScheme ? "#94a3b8" : "#64748b"}
          />
          <Text className="mt-4 text-center text-slate-800 dark:text-white font-medium">
            No Connected Doctors
          </Text>
          <Text className="mt-2 text-center text-slate-600 dark:text-slate-400">
            You need to connect with doctors before booking appointments.
          </Text>
          <Button onPress={() => router.push("/doctors")} className="mt-4">
            Find Doctors
          </Button>
        </View>
      );
    }

    return (
      <View className="p-4">
        <Text className="text-lg font-bold text-slate-800 dark:text-white mb-4">
          Select Doctor
        </Text>

        <FlatList
          data={doctors}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleDoctorSelect(item)}
              className="mb-3"
            >
              <Card className="border border-gray-200 dark:border-gray-700">
                <View className="p-4">
                  <View className="flex-row items-center">
                    <Avatar
                      source={item.image}
                      fallback={item.name.substring(0, 2)}
                      size="md"
                      className="mr-3"
                    />
                    <View className="flex-1">
                      <Text className="font-medium text-slate-800 dark:text-white">
                        {item.name}
                      </Text>
                      <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {item.role.replace("_", " ")}
                      </Text>
                      {item.specialties && item.specialties.length > 0 && (
                        <Text className="text-xs text-teal-600 dark:text-teal-400">
                          {item.specialties.join(", ")}
                        </Text>
                      )}
                    </View>
                    <Feather
                      name="chevron-right"
                      size={20}
                      color={isDarkColorScheme ? "#94a3b8" : "#64748b"}
                    />
                  </View>

                  {item.location && (
                    <View className="flex-row items-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <Feather
                        name="map-pin"
                        size={14}
                        color={isDarkColorScheme ? "#94a3b8" : "#64748b"}
                        className="mr-1"
                      />
                      <Text className="text-xs text-gray-500 dark:text-gray-400">
                        {item.location}
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-8">
              <Text className="text-center text-slate-600 dark:text-slate-400">
                No doctors available
              </Text>
            </View>
          }
        />
      </View>
    );
  };
  // Render appointment details and confirmation
  const renderAppointmentDetails = () => {
    if (loading && !refreshing) {
      return (
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator
            size="large"
            color={isDarkColorScheme ? "#0ea5e9" : "#0284c7"}
          />
          <Text className="mt-4 text-slate-600 dark:text-slate-400">
            Loading...
          </Text>
        </View>
      );
    }

    return (
      <View className="p-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => setStep(2)} className="mr-2">
            <Feather
              name="chevron-left"
              size={24}
              color={isDarkColorScheme ? "#fff" : "#334155"}
            />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-slate-800 dark:text-white flex-1">
            Confirm Appointment
          </Text>
        </View>

        {/* Selected doctor and time summary */}
        {selectedDoctor && selectedSlot && (
          <Card className="mb-6 border border-gray-200 dark:border-gray-700">
            <View className="p-4">
              <View className="flex-row items-center mb-4">
                <Avatar
                  source={selectedDoctor.image}
                  fallback={selectedDoctor.name.substring(0, 2)}
                  size="md"
                  className="mr-3"
                />
                <View>
                  <Text className="font-medium text-slate-800 dark:text-white">
                    {selectedDoctor.name}
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedDoctor.role.replace("_", " ")}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mb-2">
                <View className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/20 items-center justify-center mr-2">
                  <Feather name="calendar" size={16} color="#00c4b4" />
                </View>
                <View>
                  <Text className="text-sm font-medium text-slate-800 dark:text-white">
                    {new Date(selectedSlot).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(selectedSlot).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>

              {selectedDoctor.location && (
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/20 items-center justify-center mr-2">
                    <Feather name="map-pin" size={16} color="#818cf8" />
                  </View>
                  <Text className="text-sm text-gray-700 dark:text-gray-300">
                    {selectedDoctor.location}
                  </Text>
                </View>
              )}

              {selectedDoctor.consultationFee && (
                <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    Consultation Fee
                  </Text>
                  <Text className="font-medium text-slate-800 dark:text-white">
                    ${selectedDoctor.consultationFee}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Appointment Type */}
        <Text className="font-medium text-slate-800 dark:text-white mb-2">
          Appointment Type
        </Text>
        <View className="flex-row mb-4">
          <TouchableOpacity
            onPress={() => handleTypeSelect("IN_PERSON")}
            className={`flex-1 mr-2 p-3 rounded-lg border ${
              appointmentType === "IN_PERSON"
                ? "bg-teal-50 dark:bg-teal-900/20 border-teal-400 dark:border-teal-600"
                : "bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700"
            }`}
          >
            <View className="items-center">
              <Feather
                name="user"
                size={24}
                color={
                  appointmentType === "IN_PERSON"
                    ? isDarkColorScheme
                      ? "#5eead4"
                      : "#0d9488"
                    : isDarkColorScheme
                    ? "#94a3b8"
                    : "#64748b"
                }
              />
              <Text
                className={`mt-2 ${
                  appointmentType === "IN_PERSON"
                    ? "text-teal-600 dark:text-teal-400"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                In Person
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTypeSelect("VIDEO_CONSULTATION")}
            className={`flex-1 p-3 rounded-lg border ${
              appointmentType === "VIDEO_CONSULTATION"
                ? "bg-teal-50 dark:bg-teal-900/20 border-teal-400 dark:border-teal-600"
                : "bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700"
            }`}
          >
            <View className="items-center">
              <Feather
                name="video"
                size={24}
                color={
                  appointmentType === "VIDEO_CONSULTATION"
                    ? isDarkColorScheme
                      ? "#5eead4"
                      : "#0d9488"
                    : isDarkColorScheme
                    ? "#94a3b8"
                    : "#64748b"
                }
              />
              <Text
                className={`mt-2 ${
                  appointmentType === "VIDEO_CONSULTATION"
                    ? "text-teal-600 dark:text-teal-400"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Video
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Reason for Visit */}
        <Text className="font-medium text-slate-800 dark:text-white mb-2">
          Reason for Visit
        </Text>
        <TextInput
          value={reasonForVisit}
          onChangeText={setReasonForVisit}
          placeholder="Briefly describe your symptoms or reason for the visit"
          multiline
          numberOfLines={4}
          className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-slate-800 dark:text-white mb-6"
          placeholderTextColor={isDarkColorScheme ? "#94a3b8" : "#64748b"}
          style={{ textAlignVertical: "top" }}
        />

        {/* Book Button */}
        <Button
          onPress={bookAppointment}
          disabled={bookingInProgress}
          className="mb-4"
        >
          {bookingInProgress ? (
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#fff" />
              <Text className="text-white ml-2">Booking...</Text>
            </View>
          ) : (
            "Book Appointment"
          )}
        </Button>
      </View>
    );
  };

  // Main render function
  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <Text className="text-xl font-bold text-slate-800 dark:text-white">
          Appointments
        </Text>
      </View>

      <Tabs
        tabs={[
          { id: "upcoming", label: "Upcoming" },
          { id: "book", label: "Book New" },
          { id: "past", label: "Past" },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab as "upcoming" | "book" | "past");
          if (tab === "book") {
            setShowBooking(true);
          }
        }}
        className="mb-2"
      />

      {/* Replace ScrollView with direct content rendering based on tab */}
      {activeTab === "upcoming" && (
        <View className="flex-1">
          {loading && !refreshing ? (
            <View className="items-center justify-center py-12">
              <ActivityIndicator
                size="large"
                color={isDarkColorScheme ? "#0ea5e9" : "#0284c7"}
              />
              <Text className="mt-4 text-slate-600 dark:text-slate-400">
                Loading appointments...
              </Text>
            </View>
          ) : error ? (
            <View className="items-center justify-center py-12">
              <Feather
                name="alert-circle"
                size={48}
                color={isDarkColorScheme ? "#ef4444" : "#dc2626"}
              />
              <Text className="mt-4 text-center text-slate-600 dark:text-slate-400">
                {error}
              </Text>
              <Button onPress={() => fetchAppointments()} className="mt-4">
                Try Again
              </Button>
            </View>
          ) : upcomingAppointments.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Feather
                name="calendar"
                size={48}
                color={isDarkColorScheme ? "#94a3b8" : "#64748b"}
              />
              <Text className="mt-4 text-center text-slate-800 dark:text-white font-medium">
                No Upcoming Appointments
              </Text>
              <Text className="mt-2 text-center text-slate-600 dark:text-slate-400">
                Book an appointment with one of your doctors.
              </Text>
              <Button
                onPress={() => {
                  setActiveTab("book");
                  setShowBooking(true);
                }}
                className="mt-4"
              >
                Book Appointment
              </Button>
            </View>
          ) : (
            <FlatList
              data={upcomingAppointments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => renderAppointmentCard(item)}
              contentContainerStyle={{ padding: 16 }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
        </View>
      )}

      {/* Book New Appointment */}
      {activeTab === "book" && (
        <View className="flex-1">
          {step === 1 && renderDoctorSelection()}
          {step === 2 && (
            <ScrollView
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              {renderDateTimeSelection()}
            </ScrollView>
          )}
          {step === 3 && (
            <ScrollView
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              {renderAppointmentDetails()}
            </ScrollView>
          )}
        </View>
      )}

      {/* Past Appointments */}
      {activeTab === "past" && (
        <View className="flex-1">
          {loading && !refreshing ? (
            <View className="items-center justify-center py-12">
              <ActivityIndicator
                size="large"
                color={isDarkColorScheme ? "#0ea5e9" : "#0284c7"}
              />
              <Text className="mt-4 text-slate-600 dark:text-slate-400">
                Loading appointments...
              </Text>
            </View>
          ) : error ? (
            <View className="items-center justify-center py-12">
              <Feather
                name="alert-circle"
                size={48}
                color={isDarkColorScheme ? "#ef4444" : "#dc2626"}
              />
              <Text className="mt-4 text-center text-slate-600 dark:text-slate-400">
                {error}
              </Text>
              <Button onPress={() => fetchAppointments()} className="mt-4">
                Try Again
              </Button>
            </View>
          ) : pastAppointments.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Feather
                name="clock"
                size={48}
                color={isDarkColorScheme ? "#94a3b8" : "#64748b"}
              />
              <Text className="mt-4 text-center text-slate-800 dark:text-white font-medium">
                No Past Appointments
              </Text>
              <Text className="mt-2 text-center text-slate-600 dark:text-slate-400">
                Your appointment history will appear here.
              </Text>
            </View>
          ) : (
            <FlatList
              data={pastAppointments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => renderAppointmentCard(item)}
              contentContainerStyle={{ padding: 16 }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
