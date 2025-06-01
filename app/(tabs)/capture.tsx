import { useState, useRef, useEffect } from "react";
import ENV from "~/lib/env";

import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  CameraView,
  useCameraPermissions,
  FlashMode,
  FocusMode,
} from "expo-camera";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { CustomSlider } from "~/components/ui/slider";
import { Badge } from "~/components/ui/badge";
import { ThemeToggle } from "~/components/theme-toggle";
import { useColorScheme } from "~/lib/useColorScheme";
import { cld, uploadToCloudinary } from "~/lib/cloudinary";
import * as SecureStore from "expo-secure-store";
import { TextInput } from "react-native";
import { ApiResponse, LesionCase } from "~/types/mobile-api";
import i18n from "~/i18n";

// Body location enum matching your Prisma schema
enum BodyLocation {
  HEAD = "HEAD",
  NECK = "NECK",
  CHEST = "CHEST",
  BACK = "BACK",
  ABDOMEN = "ABDOMEN",
  ARMS = "ARMS",
  HANDS = "HANDS",
  LEGS = "LEGS",
  FEET = "FEET",
  OTHER = "OTHER",
}

export default function CaptureScreen() {
  const [captured, setCaptured] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [cloudinaryData, setCloudinaryData] = useState<{
    publicId: string;
    imageUrl: string;
  } | null>(null);

  // New state variables for body location and lesion size
  const [bodyLocation, setBodyLocation] = useState<BodyLocation>(
    BodyLocation.OTHER
  );
  const [showBodyLocationPicker, setShowBodyLocationPicker] = useState(false);
  const [lesionSize, setLesionSize] = useState<string>("");
  const [flashMode, setFlashMode] = useState<FlashMode>("off");

  const cameraRef = useRef<CameraView>(null);
  const { isDarkColorScheme } = useColorScheme();

  // Permissions hook
  const [permission, requestPermission] = useCameraPermissions();
  const [lesionCase, setLesionCase] = useState<any>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [imageId, setImageId] = useState<string | null>(null);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Take photo
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setImageUri(photo?.uri!);
        setCaptured(true);
      } catch (err) {
        console.error("Error taking picture:", err);
      }
    }
  };

  // Pick from gallery
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setCaptured(true);
    }
  };
  const toggleFlash = () => {
    setFlashMode((prevMode) => (prevMode === "off" ? "on" : "off"));
  };

  // Split the function into upload and analyze
  const uploadImage = async () => {
    if (!imageUri) return;

    // Validate inputs
    if (!bodyLocation) {
      alert("Please select a body location");
      return;
    }

    setUploading(true);

    try {
      // Upload the image to Cloudinary
      const cloudinaryResponse = await uploadToCloudinary(imageUri);

      if (!cloudinaryResponse) {
        alert("Failed to upload to Cloudinary. Please try again.");
        setUploading(false);
        return;
      }

      // Set Cloudinary data from the response
      setCloudinaryData({
        publicId: cloudinaryResponse.public_id,
        imageUrl: cloudinaryResponse.secure_url,
      });

      // Create image record in your API
      try {
        const token = await SecureStore.getItemAsync("token");
        if (!token) {
          throw new Error("Authentication token not found");
        }

        // Upload the image to your API
        const apiResponse = await fetch(
          `${ENV.API_URL}/api/mobile/upload-image`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              publicId: cloudinaryResponse.public_id,
              imageUrl: cloudinaryResponse.secure_url,
              bodyLocation: bodyLocation,
              lesionSize: parseFloat(lesionSize),
              notes: "Uploaded from mobile app",
            }),
          }
        );
        const imageData = await apiResponse.json();

        if (!apiResponse.ok) {
          throw new Error(imageData.error || "Failed to upload image");
        }

        // Store the image ID for later analysis
        setImageId(imageData.id);
        setUploadSuccess(true);
      } catch (apiError) {
        console.error("API upload error:", apiError);
        alert("Failed to save image data. Please try again.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // New function to analyze the uploaded image
  const analyzeImage = async () => {
    if (!imageId || !cloudinaryData) {
      alert("Please upload an image first");
      return;
    }

    setAnalyzing(true);

    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Request lesion case analysis
      const lesionCaseResponse = await fetch(
        `${ENV.API_URL}/api/mobile/lesion-case`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            imageId: imageId,
            imageUrl: cloudinaryData.imageUrl,
            bodyLocation: bodyLocation,
            lesionSize: parseFloat(lesionSize),
            notes: "Uploaded from mobile app",
          }),
        }
      );

      const lesionCaseData: ApiResponse<LesionCase> =
        await lesionCaseResponse.json();

      if (!lesionCaseResponse.ok) {
        throw new Error(lesionCaseData.error || "Failed to analyze lesion");
      }

      // Set the lesion case data
      setLesionCase(lesionCaseData.data);
      setAnalyzed(true);
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Failed to analyze image. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Permission states
  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-teal-50 dark:bg-slate-900">
        <Text className="text-slate-800 dark:text-white">
          {i18n.t("capture.noPermission")}
        </Text>
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-teal-50 dark:bg-slate-900">
        <Text className="text-slate-800 dark:text-white">
          {i18n.t("capture.noAccess")}
        </Text>
        <Button onPress={requestPermission} className="mt-4">
          {i18n.t("capture.allowCamera")}
        </Button>
        <Button onPress={pickImage} variant="outline" className="mt-2">
          {i18n.t("capture.selectGallery")}
        </Button>
      </View>
    );
  }
  return (
    <ScrollView className="flex-1 bg-teal-50 dark:bg-slate-900">
      <View className="">
        <Card className="w-full max-w-md mx-auto">
          <View className="px-6 pt-8 pb-4">
            <Text className="text-2xl font-bold mb-1 text-slate-800 dark:text-white">
              {i18n.t("capture.title")}
            </Text>
            <Text className="text-gray-500 dark:text-gray-400">
              {i18n.t("capture.subtitle")}
            </Text>
          </View>

          <View className="aspect-square bg-gray-100 dark:bg-gray-700">
            {captured && imageUri ? (
              <Image
                source={{ uri: imageUri }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <CameraView
                ref={cameraRef}
                style={{ flex: 1 }}
                facing={ImagePicker.CameraType.back}
                flash={flashMode}
                focusable={true}
              >
                <View className="flex-1">
                  <View className="flex-1 items-center justify-center">
                    <View className="items-center">
                      <Feather
                        name="camera"
                        size={48}
                        color="rgba(255,255,255,0.5)"
                      />
                      <Text className="text-white opacity-50 mt-4">
                        {i18n.t("capture.subtitle")}
                      </Text>
                    </View>
                  </View>
                </View>
              </CameraView>
            )}
          </View>

          {!captured ? (
            <View className="px-6 py-4 flex-col gap-4">
              <View className="mt-6 pt-6">
                <Text className="font-medium mb-3 text-slate-800 dark:text-white">
                  Capture Guidelines
                </Text>
                <View className="gap-3">
                  {[
                    [
                      "Good Lighting",
                      "Use natural light when possible. Avoid shadows.",
                    ],
                    [
                      "Steady Hand",
                      "Hold your device steady to avoid blurry images.",
                    ],
                    [
                      "Clean Lens",
                      "Make sure your camera lens is clean and clear.",
                    ],
                  ].map(([title, desc], i) => (
                    <View key={i} className="flex-row">
                      <View className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-lg mr-3">
                        <Feather name="info" size={16} color="#00c4b4" />
                      </View>
                      <View>
                        <Text className="font-medium text-slate-800 dark:text-white">
                          {title}
                        </Text>
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                          {desc}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
              <View className="gap-4">
                <Button
                  onPress={takePicture}
                  className="rounded-full py-4"
                  icon={<Feather name="camera" size={20} color="white" />}
                  iconPosition="left"
                >
                  {i18n.t("capture.captureButton")}
                </Button>
                <Button
                  variant="outline"
                  onPress={pickImage}
                  icon={
                    <Feather
                      name="image"
                      size={18}
                      color={isDarkColorScheme ? "#fff" : "#334155"}
                    />
                  }
                  iconPosition="left"
                >
                  {i18n.t("capture.selectGallery")}
                </Button>
              </View>
            </View>
          ) : (
            <View className="p-6">
              {/* Body Location */}
              <View className="mb-4">
                <Text className="font-medium mb-2 text-slate-800 dark:text-white">
                  {i18n.t("capture.bodyLocation")}
                </Text>
                <TouchableOpacity
                  className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-600"
                  onPress={() =>
                    setShowBodyLocationPicker(!showBodyLocationPicker)
                  }
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-800 dark:text-white">
                      {bodyLocation.replace("_", " ")}
                    </Text>
                    <Feather
                      name={
                        showBodyLocationPicker ? "chevron-up" : "chevron-down"
                      }
                      size={16}
                      color={isDarkColorScheme ? "#fff" : "#334155"}
                    />
                  </View>
                </TouchableOpacity>
                {showBodyLocationPicker && (
                  <View className="mt-1 p-2 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    {Object.values(BodyLocation).map((location) => (
                      <TouchableOpacity
                        key={location}
                        className={`p-3 rounded-md ${
                          bodyLocation === location
                            ? "bg-teal-100 dark:bg-teal-900/30"
                            : ""
                        }`}
                        onPress={() => {
                          setBodyLocation(location);
                          setShowBodyLocationPicker(false);
                        }}
                      >
                        <Text className="text-slate-800 dark:text-white">
                          {location.replace("_", " ")}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Lesion Size */}
              <View className="mb-4">
                <Text className="font-medium mb-2 text-slate-800 dark:text-white">
                  {i18n.t("capture.lesionSize")}
                </Text>
                <TextInput
                  className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-600 text-slate-800 dark:text-white"
                  placeholder={i18n.t("capture.enterLesionSize")}
                  placeholderTextColor={
                    isDarkColorScheme ? "#94a3b8" : "#64748b"
                  }
                  keyboardType="numeric"
                  value={lesionSize}
                  onChangeText={setLesionSize}
                />
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-4">
                <Button
                  variant="outline"
                  onPress={() => {
                    // Reset states for retake
                    setCaptured(false);
                    setImageUri(null);
                    setUploadSuccess(false);
                    setAnalyzed(false);
                    setImageId(null);
                    setCloudinaryData(null);
                    setLesionCase(null);
                  }}
                  className="flex-1"
                  icon={
                    <Feather
                      name="refresh-cw"
                      size={18}
                      color={isDarkColorScheme ? "#fff" : "#334155"}
                    />
                  }
                  iconPosition="left"
                >
                  {i18n.t("capture.retake")}
                </Button>

                {!uploadSuccess ? (
                  <Button
                    onPress={uploadImage}
                    className="flex-1"
                    icon={
                      uploading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Feather name="upload-cloud" size={18} color="white" />
                      )
                    }
                    iconPosition="left"
                    disabled={uploading}
                  >
                    {uploading
                      ? i18n.t("capture.uploading")
                      : i18n.t("capture.upload")}
                  </Button>
                ) : !analyzed ? (
                  <Button
                    onPress={analyzeImage}
                    className="flex-1"
                    icon={
                      analyzing ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Feather name="search" size={18} color="white" />
                      )
                    }
                    iconPosition="left"
                    disabled={analyzing}
                  >
                    {analyzing
                      ? i18n.t("capture.analyzing")
                      : i18n.t("capture.analyzeImage")}
                  </Button>
                ) : null}
              </View>

              {analyzed && lesionCase && (
                <Button
                  onPress={() => {
                    router.push({
                      pathname: "/result-detail",
                      params: { id: lesionCase.id },
                    });
                  }}
                  className="mt-3"
                  icon={<Feather name="eye" size={18} color="white" />}
                  iconPosition="left"
                >
                  {i18n.t("capture.viewResults")}
                </Button>
              )}
            </View>
          )}
        </Card>
      </View>
    </ScrollView>
  );
}
