import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  Pressable,
  BackHandler,
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

// Create getstream client outside component to avoid recreating it
let streamClient: StreamVideoClient | null = null;

// Component to render the actual call UI once everything is set up
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
      {/* Doctor info header */}
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

      {/* The call UI will be rendered automatically by StreamCall */}
    </StreamCall>
  );
}

export default function VideoCallScreen() {
  const { roomId, appointmentId, doctorName, doctorImage } =
    useLocalSearchParams();
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        handleEndCall();
        return true;
      }
    );

    return () => backHandler.remove();
  }, []);

  // Initialize the call
  useEffect(() => {
    async function initializeCall() {
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
        const user = (await SecureStore.getItemAsync("user")) as User | null;

        const userInfoData = user;
        if (!userInfoData) {
          throw new Error("User info is required");
        }
        // Create GetStream token
        const streamTokenResponse = await fetch(
          `http://192.168.10.30:3000/api/mobile/video-calls/stream-token?userId=${userInfoData.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const streamTokenData = await streamTokenResponse.json();
        if (!streamTokenResponse.ok) {
          throw new Error(
            streamTokenData.error || "Failed to get Stream token"
          );
        }

        // Update room status to active
        if (appointmentId) {
          await fetch(
            `http://192.168.10.30:3000/api/mobile/video-calls/status`,
            {
              method: "PUT",
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
        }

        // Initialize GetStream client
        const apiKey = "s8hqchfn888p"; // Replace with your GetStream API key

        // Create a user
        const streamUser = user;

        setUser(streamUser);

        // Initialize client if not already created
        if (!streamClient) {
          streamClient = new StreamVideoClient({
            apiKey,
            user: streamUser,
            token: streamTokenData.token,
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
    }

    initializeCall();

    // Cleanup function
    return () => {
      if (call) {
        call.leave();
      }
      // Don't disconnect client here to allow reuse
    };
  }, [roomId, appointmentId, router]);

  const handleEndCall = async () => {
    Alert.alert(
      "End Call",
      "Are you sure you want to end this call?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "End Call",
          style: "destructive",
          onPress: async () => {
            try {
              // Leave the call
              if (call) {
                await call.leave();
              }

              const token = await SecureStore.getItemAsync("token");
              if (token && roomId) {
                // Update room status to ended
                await fetch(
                  `http://192.168.10.30:3000/api/mobile/video-calls/status`,
                  {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      roomId,
                      status: "ENDED",
                    }),
                  }
                );
              }

              // Navigate back to appointment detail
              if (appointmentId) {
                router.replace(`/appointment-detail?id=${appointmentId}`);
              } else {
                router.replace("/appointments");
              }
            } catch (err) {
              console.error("Error ending call:", err);
              router.replace("/appointments");
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900">
        <Stack.Screen
          options={{
            title: "Video Call",
            headerShown: false,
          }}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text className="mt-4 text-white">Connecting to video call...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900">
        <Stack.Screen
          options={{
            title: "Video Call Error",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#0f172a",
            },
            headerTintColor: "#ffffff",
          }}
        />
        <View className="flex-1 items-center justify-center p-6">
          <Feather name="video-off" size={48} color="#ef4444" />
          <Text className="mt-4 text-center text-white font-bold text-lg">
            Failed to join video call
          </Text>
          <Text className="mt-2 text-center text-gray-400">{error}</Text>
          <Pressable
            className="mt-6 bg-blue-600 py-3 px-6 rounded-lg"
            onPress={() =>
              router.replace(`/appointment-detail?id=${appointmentId}`)
            }
          >
            <Text className="text-white font-medium">
              Return to Appointment
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!call || !user || !streamClient) {
    return null;
  }

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen
        options={{
          title: "Video Call",
          headerShown: false,
        }}
      />

      <StreamVideo client={streamClient}>
        <CallRenderer
          call={call}
          doctorName={doctorName as string}
          doctorImage={doctorImage as string}
          onEndCall={handleEndCall}
        />
      </StreamVideo>
    </View>
  );
}
