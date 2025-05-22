"use client";

import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Avatar } from "~/components/ui/avatar";
import { ThemeToggle } from "~/components/theme-toggle";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "~/lib/useColorScheme";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

// Import the types from your API types file
import { DoctorSummary, DoctorDetail } from "~/types/mobile-api";

export default function FindDoctorScreen() {
  const { isDarkColorScheme } = useColorScheme();
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [doctorDetail, setDoctorDetail] = useState<DoctorDetail | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch doctors list on mount
  useEffect(() => {
    async function fetchDoctors() {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        console.error("No token found");
        return;
      }
      try {
        const response = await fetch(
          "http://192.168.10.30:3000/api/mobile/doctors?limit=10",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const json = await response.json();
        if (json.success) {
          setDoctors(json.data.doctors);
        } else {
          console.error("Error fetching doctors list:", json.error);
        }
      } catch (error) {
        console.error("Error fetching doctors list:", error);
      }
    }
    fetchDoctors();
  }, []);

  // Fetch selected doctor's details when selectedDoctorId changes
  useEffect(() => {
    async function fetchDoctorDetail() {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        console.error("No token found");
        return;
      }
      if (!selectedDoctorId) return;
      try {
        const response = await fetch(
          `http://192.168.10.30:3000/api/mobile/doctors/${selectedDoctorId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const json = await response.json();
        if (json.success) {
          setDoctorDetail(json.data);
        } else {
          console.error("Error fetching doctor detail:", json.error);
        }
      } catch (error) {
        console.error("Error fetching doctor detail:", error);
      }
    }
    fetchDoctorDetail();
  }, [selectedDoctorId]);
  useEffect(() => {
    if (!doctorDetail) return;
    const fetchConnectionStatus = async () => {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        console.error("No token found");
        Alert.alert("Authentication Error", "Please login again");
        setIsConnecting(false);
        return;
      }
      // First check if connection already exists
      let response = await fetch(
        `http://192.168.10.30:3000/api/mobile/connection/create?doctorId=${doctorDetail.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let data = await response.json();
      console.log("Connection status data:", data.data.status);

      if (data.exists) {
        setConnectionStatus(data.data.status);
        if (data.data.status === "PENDING") {
          setConnectionStatus("PENDING");
        } else if (data.data.status === "APPROVED") {
          setConnectionStatus("APPROVED");
        } else if (data.data.status === "DECLINED") {
          setConnectionStatus("DECLINED");
        }
      }
    };
    fetchConnectionStatus();
  }, [selectedDoctorId]);
  const handleConnect = async () => {
    if (!doctorDetail) return;

    setIsConnecting(true);
    try {
      // Get token from secure store
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        console.error("No token found");
        Alert.alert("Authentication Error", "Please login again");
        setIsConnecting(false);
        return;
      }

      // First check if connection already exists
      let response = await fetch(
        `http://192.168.10.30:3000/api/mobile/connection/create?doctorId=${doctorDetail.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let data = await response.json();

      // If connection exists, update status and show appropriate message
      if (data.exists) {
        setConnectionStatus(data.data.status);

        if (data.data.status === "PENDING") {
          Alert.alert(
            "Connection Pending",
            "Your connection request is waiting for approval"
          );
        } else if (data.data.status === "APPROVED") {
          Alert.alert(
            "Already Connected",
            "You are already connected with this doctor"
          );
        } else if (data.data.status === "DECLINED") {
          Alert.alert(
            "Connection Declined",
            "Your previous connection request was declined"
          );
        }
      } else {
        // If no connection exists, create one
        response = await fetch(
          "http://192.168.10.30:3000/api/mobile/connection/create",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              doctorId: doctorDetail.id,
              message:
                "I would like to connect with you regarding my skin health.",
            }),
          }
        );

        data = await response.json();

        if (data.success) {
          setConnectionStatus("PENDING");
          Alert.alert(
            "Request Sent",
            "Your connection request has been sent to the doctor"
          );
        } else {
          Alert.alert(
            "Error",
            data.error || "Failed to send connection request"
          );
        }
      }
    } catch (error) {
      console.error("Error handling connection:", error);
      Alert.alert(
        "Connection Error",
        "There was a problem processing your connection request"
      );
    } finally {
      setIsConnecting(false);
    }
  };
  // Within your existing FindDoctorScreen component, update the helper functions:
  const handleChat = () => {
    router.push(`/(tabs)/chat/${doctorDetail?.id}`);
  };

  const handleVideoCall = () => {
    router.push("/(tabs)/video");
  };

  return (
    <SafeAreaView
      className="flex-1 bg-teal-50 dark:bg-slate-900"
      edges={["top"]}
    >
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <Card className="w-full max-w-md mx-auto">
          {/* Header */}
          <View className="px-6 pt-6 pb-4 flex-row items-center">
            <TouchableOpacity className="mr-2" onPress={() => router.back()}>
              <Feather
                name="chevron-left"
                size={24}
                color={isDarkColorScheme ? "#fff" : "#334155"}
              />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-bold text-slate-800 dark:text-white">
                Find Doctor
              </Text>
              <Text className="text-gray-500 dark:text-gray-400">
                Connect with a specialist
              </Text>
            </View>
          </View>

          {/* Search input */}
          <View className="px-6 pb-2">
            <View className="relative mb-6">
              <Input
                placeholder="Search doctors..."
                leftIcon={
                  <Feather
                    name="search"
                    size={20}
                    color={isDarkColorScheme ? "#94a3b8" : "#64748b"}
                  />
                }
              />
            </View>

            {/* Doctors List */}
            <View className="gap-3 mb-6">
              {doctors.map((doctor) => (
                <TouchableOpacity
                  key={doctor.id}
                  onPress={() => {
                    setSelectedDoctorId(
                      doctor.id === selectedDoctorId ? null : doctor.id
                    );
                    setDoctorDetail(null);
                  }}
                  className={`p-4 rounded-xl ${
                    selectedDoctorId === doctor.id
                      ? "bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800"
                      : "bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <View className="flex-row">
                    <View className="relative mr-3">
                      <Avatar
                        source={doctor.avatarUrl}
                        size="lg"
                        fallback={doctor.name.charAt(0)}
                      />
                      <View
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-700 ${
                          doctor.status === "online"
                            ? "bg-green-500"
                            : "bg-gray-400"
                        }`}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-slate-800 dark:text-white">
                        {doctor.name}
                      </Text>
                      <Text className="text-sm text-gray-500 dark:text-gray-400">
                        {doctor.specialty}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Feather name="star" size={12} color="#f59e0b" />
                        <Text className="text-xs ml-1 text-gray-500 dark:text-gray-400">
                          {doctor.rating} ({doctor.reviews} reviews)
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Doctor Detail */}
            {doctorDetail && (
              <View className="mb-6 flex flex-col gap-4">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="font-medium text-slate-800 dark:text-white">
                    Doctor Details
                  </Text>
                  <Badge variant="success">Available Now</Badge>
                </View>

                <View className="gap-4">
                  {/* <View className="flex-row gap-3">
                    <View className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-slate-700 items-center">
                      <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Experience
                      </Text>
                      <Text className="font-medium text-slate-800 dark:text-white">
                        {doctorDetail.experience}+ Years
                      </Text>
                    </View>
                    <View className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-slate-700 items-center">
                      <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Patients
                      </Text>
                      <Text className="font-medium text-slate-800 dark:text-white">
                        {doctorDetail.patients}
                      </Text>
                    </View>
                    <View className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-slate-700 items-center">
                      <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Rating
                      </Text>
                      <Text className="font-medium text-slate-800 dark:text-white">
                        {doctorDetail.rating}/5
                      </Text>
                    </View>
                  </View> */}

                  <View className="bg-white dark:bg-slate-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                    <Text className="font-medium mb-2 text-slate-800 dark:text-white">
                      Specializations
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {doctorDetail.specializations.map((spec, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                        >
                          {spec}
                        </Badge>
                      ))}
                    </View>
                  </View>

                  <View className="bg-white dark:bg-slate-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                    <Text className="font-medium mb-2 text-slate-800 dark:text-white">
                      Education & Training
                    </Text>
                    <View className="gap-2">
                      {doctorDetail.education.map((edu, index) => (
                        <View key={index}>
                          <Text className="text-sm font-medium text-slate-800 dark:text-white">
                            {edu.institution}
                          </Text>
                          <Text className="text-xs text-gray-500 dark:text-gray-400">
                            {edu.degree}, {edu.years}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View className="bg-white dark:bg-slate-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                    <Text className="font-medium mb-2 text-slate-800 dark:text-white">
                      Patient Reviews
                    </Text>
                    <View className="gap-3">
                      {doctorDetail.reviews.map((rev) => (
                        <View key={rev.id}>
                          <View className="flex-row items-center mb-1">
                            <View className="flex-row mr-2">
                              {[...Array(5)].map((_, star) => (
                                <Feather
                                  key={star}
                                  name="star"
                                  size={12}
                                  color={
                                    star < rev.rating ? "#f59e0b" : "#e2e8f0"
                                  }
                                />
                              ))}
                            </View>
                            <Text className="text-xs font-medium text-slate-800 dark:text-white">
                              {rev.patientName}
                            </Text>
                          </View>
                          <Text className="text-xs text-gray-600 dark:text-gray-300">
                            {rev.comment}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-3 mb-6">
                  <Button
                    variant="outline"
                    onPress={handleConnect}
                    className="flex-1"
                    icon={<Feather name="link" size={18} color="#00c4b4" />}
                    iconPosition="left"
                    disabled={
                      isConnecting ||
                      connectionStatus === "PENDING" ||
                      connectionStatus === "APPROVED"
                    }
                  >
                    {isConnecting
                      ? "Connecting..."
                      : connectionStatus === "PENDING"
                      ? "Pending"
                      : connectionStatus === "APPROVED"
                      ? "Connected"
                      : "Connect"}
                  </Button>
                  <Button
                    variant="outline"
                    onPress={handleChat}
                    className="flex-1"
                    icon={
                      <Feather
                        name="message-circle"
                        size={18}
                        color="#00c4b4"
                      />
                    }
                    iconPosition="left"
                  >
                    Chat
                  </Button>
                  <Button
                    onPress={handleVideoCall}
                    className="flex-1"
                    icon={<Feather name="video" size={18} color="white" />}
                    iconPosition="left"
                  >
                    Video Call
                  </Button>
                </View>
              </View>
            )}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
