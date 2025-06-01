import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  TextInput,
  Linking,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Avatar } from "~/components/ui/avatar";
import { ThemeToggle } from "~/components/theme-toggle";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "~/lib/useColorScheme";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { cld, uploadToCloudinary } from "~/lib/cloudinary";
import { ProfileData } from "~/types/mobile-api";
import ENV from "~/lib/env";
import i18n from "~/i18n";

export default function ProfileScreen() {
  const { isDarkColorScheme } = useColorScheme();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form values - initialized with empty values
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [allergies, setAllergies] = useState("");

  // Permission states
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(
    null
  );
  const [locationPermission, setLocationPermission] = useState<boolean | null>(
    null
  );
  const [notificationPermission, setNotificationPermission] = useState<
    boolean | null
  >(null);

  // Settings toggles
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [enableCameraAccess, setEnableCameraAccess] = useState(true);
  const [enableLocationAccess, setEnableLocationAccess] = useState(true);

  useEffect(() => {
    fetchProfileData();
    checkPermissions();
  }, []);

  // Check current permissions on component mount
  const checkPermissions = async () => {
    try {
      // Check camera permission
      const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
      setCameraPermission(cameraStatus.status === "granted");

      // Check location permission
      const locationStatus = await Location.getForegroundPermissionsAsync();
      setLocationPermission(locationStatus.status === "granted");

      // Check notification permission
      const notificationStatus = await Notifications.getPermissionsAsync();
      setNotificationPermission(notificationStatus.status === "granted");

      // Update UI toggles to match actual permissions
      setEnableCameraAccess(cameraStatus.status === "granted");
      setEnableLocationAccess(locationStatus.status === "granted");
      setEnableNotifications(notificationStatus.status === "granted");
    } catch (err) {
      console.error("Error checking permissions:", err);
    }
  };

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        router.replace("/");
        return;
      }

      const response = await fetch(`${ENV.API_URL}/api/mobile/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch profile data");
      }

      setProfileData(data.data);

      // Initialize form values with data
      if (data.data) {
        setFullName(data.data.name || "");
        setEmail(data.data.email || "");
        setPhoneNumber(data.data.profile?.phoneNumber || "");
        setHeight(data.data.patient?.height?.toString() || "");
        setWeight(data.data.patient?.weight?.toString() || "");
        setAllergies(data.data.patient?.allergies || "");
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load profile data"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setUpdating(true);
      setError(null);

      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        router.replace("/");
        return;
      }

      // Create update data object
      const updateData = {
        name: fullName,
        profile: {
          firstName: fullName.split(" ")[0] || "",
          lastName: fullName.split(" ").slice(1).join(" ") || "",
          phoneNumber: phoneNumber,
        },
        patient: {
          height: height ? parseFloat(height) : undefined,
          weight: weight ? parseFloat(weight) : undefined,
          allergies: allergies,
        },
        settings: {
          enableNotifications: notificationPermission,
          enableCameraAccess: cameraPermission,
          enableLocationAccess: locationPermission,
        },
      };

      const response = await fetch(`${ENV.API_URL}/api/mobile/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      // Refresh profile data after update
      fetchProfileData();
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update profile"
      );
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  // Request camera permission
  const requestCameraPermission = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      const granted = status === "granted";

      setCameraPermission(granted);
      setEnableCameraAccess(granted);

      if (!granted) {
        showPermissionAlert("camera");
      }

      return granted;
    } catch (err) {
      console.error("Error requesting camera permission:", err);
      return false;
    }
  };

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === "granted";

      setLocationPermission(granted);
      setEnableLocationAccess(granted);

      if (!granted) {
        showPermissionAlert("location");
      }

      return granted;
    } catch (err) {
      console.error("Error requesting location permission:", err);
      return false;
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === "granted";

      setNotificationPermission(granted);
      setEnableNotifications(granted);

      if (!granted) {
        showPermissionAlert("notification");
      }

      return granted;
    } catch (err) {
      console.error("Error requesting notification permission:", err);
      return false;
    }
  };

  // Show alert when permission is denied and guide user to settings
  const showPermissionAlert = (permissionType: string) => {
    Alert.alert(
      "Permission Required",
      `${
        permissionType.charAt(0).toUpperCase() + permissionType.slice(1)
      } permission is required for this feature. Please enable it in your device settings.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Settings",
          onPress: () => {
            // Open device settings
            if (Platform.OS === "ios") {
              Linking.openURL("app-settings:");
            } else {
              Linking.openSettings();
            }
          },
        },
      ]
    );
  };

  // Handle permission toggle changes
  const handleToggleCameraAccess = async (value: boolean) => {
    if (value) {
      await requestCameraPermission();
    } else {
      // If user tries to toggle off, explain they need to do it in settings
      Alert.alert(
        "Permission Management",
        "To disable camera access, please use your device settings.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => {
              if (Platform.OS === "ios") {
                Linking.openURL("app-settings:");
              } else {
                Linking.openSettings();
              }
            },
          },
        ]
      );
      // Revert the toggle to match actual permission state
      setEnableCameraAccess(cameraPermission || false);
    }
  };

  const handleToggleLocationAccess = async (value: boolean) => {
    if (value) {
      await requestLocationPermission();
    } else {
      Alert.alert(
        "Permission Management",
        "To disable location access, please use your device settings.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => {
              if (Platform.OS === "ios") {
                Linking.openURL("app-settings:");
              } else {
                Linking.openSettings();
              }
            },
          },
        ]
      );
      setEnableLocationAccess(locationPermission || false);
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      await requestNotificationPermission();
    } else {
      Alert.alert(
        "Permission Management",
        "To disable notifications, please use your device settings.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => {
              if (Platform.OS === "ios") {
                Linking.openURL("app-settings:");
              } else {
                Linking.openSettings();
              }
            },
          },
        ]
      );
      setEnableNotifications(notificationPermission || false);
    }
  };

  const pickImage = async () => {
    try {
      // Request camera roll permission first
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera roll permissions to upload a profile photo.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === "ios") {
                  Linking.openURL("app-settings:");
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const takePicture = async () => {
    try {
      // Request camera permission
      const granted = await requestCameraPermission();

      if (!granted) {
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("Error", "Failed to take picture. Please try again.");
    }
  };
  const uploadImage = async (imageUri: string) => {
    try {
      setUploading(true);
      setError(null);

      if (!imageUri) {
        throw new Error("No image selected");
      }

      console.log("Starting upload to Cloudinary...");

      // Use our new direct upload function
      const cloudinaryResponse = await uploadToCloudinary(imageUri);

      if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
        console.error("No response URL from Cloudinary");
        Alert.alert("Error", "Failed to get image URL. Please try again.");
        setUploading(false);
        return;
      }

      console.log(
        "Upload successful, image URL:",
        cloudinaryResponse.secure_url
      );

      // Send image URL to API
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        router.replace("/");
        return;
      }

      console.log("Updating profile photo on server...");
      const apiResponse = await fetch(
        `${ENV.API_URL}/api/mobile/user/profile/photo`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            imageUrl: cloudinaryResponse.secure_url,
          }),
        }
      );

      const apiData = await apiResponse.json();

      if (!apiResponse.ok) {
        throw new Error(apiData.error || "Failed to update profile photo");
      }

      console.log("Profile photo updated successfully");
      // Refresh profile data to show new photo
      fetchProfileData();
      Alert.alert("Success", "Profile photo updated successfully");
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      Alert.alert("Error", "Failed to update profile photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await SecureStore.deleteItemAsync("token");
      await SecureStore.deleteItemAsync("refreshToken");
      await SecureStore.deleteItemAsync("user");
      router.replace("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Format exam date nicely
  const formatExamDate = () => {
    if (!profileData?.patient?.lastExamDate) return "No exam yet";
    const date = new Date(profileData.patient.lastExamDate);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Calculate age if birthdate exists
  const getAge = () => {
    if (!profileData?.profile?.dateOfBirth) return null;
    const birthDate = new Date(profileData.profile.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Get avatar initials
  const getAvatarInitials = () => {
    if (profileData?.profile?.firstName && profileData.profile.lastName) {
      return `${profileData.profile.firstName.charAt(
        0
      )}${profileData.profile.lastName.charAt(0)}`;
    }
    if (profileData?.name) {
      return profileData.name
        .split(" ")
        .map((n) => n.charAt(0))
        .join("")
        .substring(0, 2);
    }
    return "U";
  };

  return (
    <SafeAreaView
      className="flex-1 bg-teal-50 dark:bg-slate-900"
      edges={["top"]}
    >
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator
            size="large"
            color={isDarkColorScheme ? "#0ea5e9" : "#0284c7"}
          />
          <Text className="mt-4 text-slate-600 dark:text-slate-400">
            {i18n.t("profile.loading")}
          </Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center p-6">
          <Feather
            name="alert-circle"
            size={48}
            color={isDarkColorScheme ? "#ef4444" : "#dc2626"}
          />
          <Text className="mt-4 text-center text-slate-600 dark:text-slate-400">
            {error}
          </Text>
          <Button onPress={fetchProfileData} className="mt-4" variant="primary">
            {i18n.t("profile.tryAgain")}
          </Button>
        </View>
      ) : (
        <ScrollView
          className="flex-1 w-full"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <ThemeToggle />
          <Card className="w-full max-w-md mx-auto">
            <View className="relative bg-teal-500 pt-12 pb-20">
              <TouchableOpacity
                className="absolute right-4 top-4 bg-white/20 p-2 rounded-full"
                onPress={updateProfile}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Feather name="save" size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>

            <View className="px-6 pb-8 relative">
              <View className="items-center -mt-16 mb-6">
                <View className="relative">
                  <View className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full border-4 border-white dark:border-slate-800 overflow-hidden">
                    {uploading ? (
                      <View className="w-full h-full items-center justify-center">
                        <ActivityIndicator
                          size="large"
                          color={isDarkColorScheme ? "#0ea5e9" : "#0284c7"}
                        />
                      </View>
                    ) : (
                      <Avatar
                        size="xl"
                        fallback={getAvatarInitials()}
                        className="w-full h-full"
                        source={
                          profileData?.image || profileData?.profile?.avatarUrl
                        }
                      />
                    )}
                  </View>
                  <View className="absolute bottom-0 right-0 flex-row">
                    <TouchableOpacity
                      className="bg-teal-500 p-2 rounded-full mr-2"
                      onPress={takePicture}
                      disabled={uploading}
                    >
                      <Feather name="camera" size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-teal-600 p-2 rounded-full"
                      onPress={pickImage}
                      disabled={uploading}
                    >
                      <Feather name="image" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text className="text-2xl font-bold mt-3 text-slate-800 dark:text-white">
                  {profileData?.name || i18n.t("profile.defaultUser")}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">
                  {getAge() ? `${i18n.t("profile.age")}: ${getAge()}` : ""}
                  {getAge() && profileData?.patient?.lastExamDate ? " • " : ""}
                  {profileData?.patient?.lastExamDate
                    ? `${i18n.t("profile.lastExam")}: ${formatExamDate()}`
                    : ""}
                </Text>
              </View>

              <View className="mb-8">
                <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                  {i18n.t("profile.personalInformation")}
                </Text>
                <View className="gap-4">
                  <Input
                    label={i18n.t("profile.fullName")}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                  <Input
                    label={i18n.t("profile.email")}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    editable={false}
                  />
                  <Input
                    label={i18n.t("profile.phoneNumber")}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View className="mb-8">
                <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                  {i18n.t("profile.permissions")}
                </Text>
                <View className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="font-medium text-slate-800 dark:text-white">
                        {i18n.t("profile.cameraAccess")}
                      </Text>
                      <Text className="text-xs text-gray-500 dark:text-gray-400">
                        {cameraPermission
                          ? i18n.t("profile.permissionGranted")
                          : i18n.t("profile.cameraPermissionDescription")}
                      </Text>
                    </View>
                    <Switch
                      value={enableCameraAccess}
                      onValueChange={handleToggleCameraAccess}
                      trackColor={{
                        false: isDarkColorScheme ? "#334155" : "#e2e8f0",
                        true: "#00c4b4",
                      }}
                      thumbColor="white"
                    />
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="font-medium text-slate-800 dark:text-white">
                        {i18n.t("profile.locationAccess")}
                      </Text>
                      <Text className="text-xs text-gray-500 dark:text-gray-400">
                        {locationPermission
                          ? i18n.t("profile.permissionGranted")
                          : i18n.t("profile.locationPermissionDescription")}
                      </Text>
                    </View>
                    <Switch
                      value={enableLocationAccess}
                      onValueChange={handleToggleLocationAccess}
                      trackColor={{
                        false: isDarkColorScheme ? "#334155" : "#e2e8f0",
                        true: "#00c4b4",
                      }}
                      thumbColor="white"
                    />
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="font-medium text-slate-800 dark:text-white">
                        {i18n.t("profile.notifications")}
                      </Text>
                      <Text className="text-xs text-gray-500 dark:text-gray-400">
                        {notificationPermission
                          ? i18n.t("profile.permissionGranted")
                          : i18n.t("profile.notificationsDescription")}
                      </Text>
                    </View>
                    <Switch
                      value={enableNotifications}
                      onValueChange={handleToggleNotifications}
                      trackColor={{
                        false: isDarkColorScheme ? "#334155" : "#e2e8f0",
                        true: "#00c4b4",
                      }}
                      thumbColor="white"
                    />
                  </View>
                </View>
              </View>

              <View className="mb-8">
                <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                  {i18n.t("profile.healthInformation")}
                </Text>
                <View className="gap-3">
                  <View className="gap-1.5">
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-slate-800 dark:text-white">
                        {i18n.t("profile.height")}
                      </Text>
                      <TextInput
                        className="text-sm font-medium text-slate-800 dark:text-white text-right"
                        value={height}
                        onChangeText={setHeight}
                        keyboardType="numeric"
                        placeholder={i18n.t("profile.enterHeight")}
                        placeholderTextColor={
                          isDarkColorScheme ? "#94a3b8" : "#64748b"
                        }
                      />
                    </View>
                    <View className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full" />
                  </View>
                  <View className="gap-1.5">
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-slate-800 dark:text-white">
                        {i18n.t("profile.weight")}
                      </Text>
                      <TextInput
                        className="text-sm font-medium text-slate-800 dark:text-white text-right"
                        value={weight}
                        onChangeText={setWeight}
                        keyboardType="numeric"
                        placeholder={i18n.t("profile.enterWeight")}
                        placeholderTextColor={
                          isDarkColorScheme ? "#94a3b8" : "#64748b"
                        }
                      />
                    </View>
                    <View className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full" />
                  </View>
                  <View className="gap-1.5">
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-slate-800 dark:text-white">
                        {i18n.t("profile.allergies")}
                      </Text>
                      <TextInput
                        className="text-sm font-medium text-slate-800 dark:text-white text-right"
                        value={allergies}
                        onChangeText={setAllergies}
                        placeholder={i18n.t("profile.enterAllergies")}
                        placeholderTextColor={
                          isDarkColorScheme ? "#94a3b8" : "#64748b"
                        }
                      />
                    </View>
                    <View className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full" />
                  </View>
                </View>
              </View>

              <View className="gap-3">
                <Button
                  variant="destructive"
                  onPress={handleSignOut}
                  className="mt-2 bg-red-50 dark:bg-red-900/20"
                  textClassName="text-red-500 dark:text-red-400"
                >
                  {i18n.t("profile.signOut")}
                </Button>
              </View>
            </View>
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
