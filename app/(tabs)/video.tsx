import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  Pressable,
  BackHandler,
  StyleSheet,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "~/lib/useColorScheme";
import { Feather } from "@expo/vector-icons";
import { Avatar } from "~/components/ui/avatar";
import * as SecureStore from "expo-secure-store";
import {
  StreamVideo,
  StreamVideoClient,
  Call,
  User,
  useStreamVideoClient,
  StreamCall,
} from "@stream-io/video-react-native-sdk";
import ENV from "~/lib/env";
import { CallContent } from "@stream-io/video-react-native-sdk";

// Create getstream client outside component to avoid recreating it
let streamClient: StreamVideoClient | null = null;

function CallRenderer({
  call,
  doctorName,
  doctorImage,
  onEndCall,
}: {
  call: Call;
  doctorName?: string;
  doctorImage?: string;
  onEndCall: () => void;
}) {
  return (
    <StreamCall call={call}>
      <SafeAreaView className="bg-black/70 absolute top-0 left-0 right-0 z-10">
        <View className="flex-row items-center p-4">
          <Avatar
            source={doctorImage as string}
            fallback={doctorName?.substring(0, 2) || "DR"}
            size="sm"
            className="mr-3"
          />
          <Text className="text-white font-medium flex-1">
            {doctorName || "Doctor"}
          </Text>
          <Pressable
            className="bg-red-600 h-8 w-8 rounded-full items-center justify-center"
            onPress={onEndCall}
          >
            <Feather name="phone-off" size={16} color="#fff" />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Add CallContent to render the call UI */}
      <CallContent />
    </StreamCall>
  );
}

// Error display component
const ErrorView = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center p-4">
    <View className="items-center">
      <Feather name="alert-circle" size={48} color="#ef4444" />
      <Text className="text-white text-lg font-medium mt-4 text-center">
        {message}
      </Text>
      <Pressable
        className="bg-teal-600 px-6 py-3 rounded-lg mt-6"
        onPress={onRetry}
      >
        <Text className="text-white font-medium">Try Again</Text>
      </Pressable>
    </View>
  </SafeAreaView>
);

export default function Video() {
  const { roomId, appointmentId, doctorName, doctorImage } =
    useLocalSearchParams();
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        return true;
      }
    );

    return () => backHandler.remove();
  }, []);

  // Clean up function for when component unmounts
  useEffect(() => {
    return () => {
      if (call) {
        try {
          call.leave();
        } catch (err) {
          console.error("Error leaving call on cleanup:", err);
        }
      }
    };
  }, [call]);

  // Initialize the call
  const initializeCall = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!roomId) {
        throw new Error("Room ID is required");
      }

      // Get user token and info
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        router.replace("/");
        return;
      }

      // Get user info with better error handling
      let userInfoData;
      try {
        const userString = await SecureStore.getItemAsync("user");
        if (!userString) throw new Error("User info not found");
        userInfoData = JSON.parse(userString);
      } catch (parseError) {
        console.error("Error parsing user data:", parseError);
        throw new Error("Invalid user data format");
      }

      if (!userInfoData) {
        throw new Error("User info is required");
      }

      // Update room status to active
      if (roomId) {
        try {
          const response = await fetch(
            `${ENV.API_URL}/api/mobile/video-calls`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                roomId,
                status: "ACTIVE",
              }),
            }
          );

          if (!response.ok) {
            console.warn(`Failed to update room status: ${response.status}`);
            // Continue anyway
          }
        } catch (statusError) {
          console.error("Error updating room status:", statusError);
          // Continue with the call even if status update fails
        }
      }

      // Get Stream token from your API
      const tokenResponse = await fetch(
        `${ENV.API_URL}/api/mobile/video-calls/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ roomId }),
        }
      );

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Stream token error response:", errorText);
        throw new Error(`Failed to get video token (${tokenResponse.status})`);
      }

      // Parse token response
      const tokenData = await tokenResponse.json();

      if (!tokenData.token) {
        console.error("Invalid token response:", tokenData);
        throw new Error("Invalid token response from server");
      }

      // Initialize GetStream client
      const apiKey = ENV.GETSTREAM_API_KEY;
      if (!apiKey) {
        throw new Error("GetStream API key not configured");
      }

      // Create a user
      const streamUser = {
        id: userInfoData.id,
        name: userInfoData.name || "User",
        image: userInfoData.image || "",
      };

      setUser(streamUser);

      // Initialize client if not already created
      if (!streamClient) {
        streamClient = new StreamVideoClient({
          apiKey,
          user: streamUser,
          token: tokenData.token,
        });
      }

      // Get or create the call
      const callType = "default";
      const callId = roomId as string;
      const newCall = streamClient.call(callType, callId);
      try {
        // Join the call
        await newCall.join({ create: true });
        setCall(newCall);
      } catch (callError) {
        console.error("Error joining call:", callError);
        throw new Error("Failed to join the call. Please try again.");
      }

      setLoading(false);
    } catch (err: any) {
      console.error("Error initializing video call:", err);
      setError(err.message || "Failed to initialize video call");
      setLoading(false);
    }
  }, [roomId, appointmentId, router]);

  // Load call when component mounts
  useEffect(() => {
    initializeCall();
  }, [initializeCall]);


  // Show loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#00C4B4" />
        <Text className="text-white mt-4">Connecting to call...</Text>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return <ErrorView message={error} onRetry={initializeCall} />;
  }

  // Show call screen
  if (call && user && streamClient) {
    return (
      <StreamVideo client={streamClient}>
        <CallRenderer
          call={call}
          doctorName={doctorName as string}
          doctorImage={doctorImage as string}
          onEndCall={()=>{router.back()}}
        />
      </StreamVideo>
    );
  }

  // Fallback
  return (
    <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center">
      <Text className="text-white">Something went wrong</Text>
      <Pressable
        className="bg-teal-600 px-6 py-3 rounded-lg mt-6"
        onPress={initializeCall}
      >
        <Text className="text-white font-medium">Try Again</Text>
      </Pressable>
    </SafeAreaView>
  );
}
