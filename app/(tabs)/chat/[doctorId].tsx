import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { ThemeToggle } from "~/components/theme-toggle";
import { useColorScheme } from "~/lib/useColorScheme";
import * as SecureStore from "expo-secure-store";
import { Card } from "~/components/ui/card";
import { AuthResponse } from "~/types/mobile-api";
import ENV from "~/lib/env";

export default function ChatScreen() {
  const { doctorId } = useLocalSearchParams();
  const { isDarkColorScheme } = useColorScheme();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);
  // Dummy current user id – replace with your auth logic
  useEffect(() => {
    async function fetchUser() {
      const userString = await SecureStore.getItemAsync("user");
      if (userString) {
        const userData = JSON.parse(userString);
        setUser(userData);
      } else {
        console.error("No user found");
      }
    }
    fetchUser();
  }, []);
  useEffect(() => {
    async function fetchMessages() {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      try {
        console.log(`Fetching messages for doctor ID: ${doctorId}`);

        const res = await fetch(
          `${ENV.API_URL}/api/mobile/chat/messages?doctorId=${doctorId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const json = await res.json();
        console.log("API response:", JSON.stringify(json, null, 2));

        if (json.success) {
          console.log(`Retrieved ${json.data.length} messages`);
          setMessages(json.data);

          // Scroll to bottom after messages load
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: false });
          }, 100);
        } else {
          console.error("Error in response:", json.error);
          Alert.alert("Error", json.error || "Failed to fetch messages", [
            { text: "OK" },
          ]);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        Alert.alert("Error", "Failed to fetch messages", [{ text: "OK" }]);
      }
    }

    fetchMessages();

    // Set up polling to fetch new messages every 10 seconds
    const intervalId = setInterval(fetchMessages, 10000);

    return () => clearInterval(intervalId);
  }, [doctorId]);

  async function sendMessage() {
    const token = await SecureStore.getItemAsync("token");
    if (!token) {
      console.error("No token found");
      return;
    }
    if (!input.trim()) return;
    try {
      const res = await fetch(`${ENV.API_URL}/api/mobile/chat/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ doctorId, content: input }),
      });
      const json = await res.json();
      if (json.success) {
        setMessages((prev) => [...prev, json.data]);
        setInput("");
        // Scroll to bottom after sending a message
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        console.error("Error sending message:", json.error);
        Alert.alert("Error", json.error || "Failed to send message", [
          { text: "OK" },
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message", [{ text: "OK" }]);
    }
  }

  return (
    <SafeAreaView
      className="flex-1 bg-teal-50 dark:bg-slate-900"
      edges={["top"]}
    >
      <ThemeToggle />
      <Card className="w-full max-w-md mx-auto flex-1">
        <View className="flex-row items-center p-4 border-b border-gray-100 dark:border-gray-700">
          <TouchableOpacity onPress={() => router.back()} className="mr-2">
            <Feather
              name="chevron-left"
              size={24}
              color={isDarkColorScheme ? "#fff" : "#334155"}
            />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-800 dark:text-white">
            Chat with Doctor
          </Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          className="flex-1 p-4"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {messages.length > 0 ? (
            <View className="gap-4">
              {messages.map((msg, idx) => {
                const isCurrentUser = msg.senderId === user?.id;
                return (
                  <View
                    key={idx}
                    className={`w-full flex ${
                      isCurrentUser ? "items-end" : "items-start"
                    }`}
                  >
                    <View className="max-w-[80%]">
                      <View
                        className={`rounded-xl p-3 ${
                          isCurrentUser
                            ? "bg-teal-500"
                            : "bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600"
                        }`}
                      >
                        <Text className="text-slate-800 dark:text-white">
                          {msg.content}
                        </Text>
                      </View>
                      <Text className="text-xs text-gray-500 mt-1 ml-1">
                        {isCurrentUser ? "You" : "Doctor"} •{" "}
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="flex-1 items-center justify-center">
              <View className="bg-white dark:bg-slate-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                <Text className="text-center text-gray-500 dark:text-gray-400">
                  No messages yet. Start the conversation!
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View className="p-4 flex-row border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-slate-800">
          <TextInput
            className="flex-1 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-600 text-slate-800 dark:text-white"
            placeholder="Type your message..."
            placeholderTextColor={isDarkColorScheme ? "#94a3b8" : "#64748b"}
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity
            className="ml-2 h-12 w-12 rounded-full bg-teal-500 items-center justify-center"
            onPress={sendMessage}
          >
            <Feather name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </Card>
    </SafeAreaView>
  );
}
