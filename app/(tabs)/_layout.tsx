import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "~/lib/useColorScheme";
import ENV from "~/lib/env";

export default function TabsLayout() {
  const { isDarkColorScheme } = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDarkColorScheme ? "#1e293b" : "#ffffff",
          borderTopColor: isDarkColorScheme ? "#334155" : "#e2e8f0",
          paddingTop: 5,
          height: 60,
        },
        tabBarActiveTintColor: "#00c4b4", // teal-500
        tabBarInactiveTintColor: isDarkColorScheme ? "#94a3b8" : "#64748b",
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="doctors"
        options={{
          title: "Doctors",
          tabBarIcon: ({ color, size }) => (
            <Feather name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          title: "Capture",
          tabBarIcon: ({ color, size }) => (
            <Feather name="camera" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Appointments",
          tabBarIcon: ({ color, size }) => (
            <Feather name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarItemStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="result-detail"
        options={{
          tabBarItemStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="chat/[doctorId]"
        options={{
          tabBarItemStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="video"
        options={{
          tabBarItemStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="appointment-detail"
        options={{
          tabBarItemStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}
