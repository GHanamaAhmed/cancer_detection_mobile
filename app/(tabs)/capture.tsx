import { useState, useRef, useEffect } from "react";
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
import { CameraView, useCameraPermissions } from "expo-camera";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { CustomSlider } from "~/components/ui/slider";
import { Badge } from "~/components/ui/badge";
import { ThemeToggle } from "~/components/theme-toggle";
import { useColorScheme } from "~/lib/useColorScheme";
import { cld, AdvancedImage, upload } from "~/lib/cloudinary";
import * as SecureStore from "expo-secure-store";
import { TextInput } from "react-native";

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
  const [lighting, setLighting] = useState(75);
  const [isFlashOn, setIsFlashOn] = useState(false);
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

  const cameraRef = useRef<CameraView>(null);
  const { isDarkColorScheme } = useColorScheme();

  // Permissions hook
  const [permission, requestPermission] = useCameraPermissions();
  const [lesionCase, setLesionCase] = useState<any>(null);
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

  // Update the uploadImage function in your capture.tsx file:
  const uploadImage = async () => {
    if (!imageUri) return;

    // Validate inputs
    if (!bodyLocation) {
      alert("Please select a body location");
      return;
    }

    if (!lesionSize || isNaN(parseFloat(lesionSize))) {
      alert("Please enter a valid lesion size");
      return;
    }

    setUploading(true);
    setUploadSuccess(false);

    try {
      // Configure upload options
      const options = {
        upload_preset: "heathcare",
        unsigned: true,
      };

      // Upload the image
      await upload(cld, {
        file: imageUri,
        options: options,
        callback: async (error, response) => {
          if (error || !response) {
            console.error("Cloudinary upload error:", error);
            alert("Failed to upload to Cloudinary. Please try again.");
            setUploading(false);
            return;
          }

          // Set Cloudinary data from the response
          setCloudinaryData({
            publicId: response.public_id,
            imageUrl: response.secure_url,
          });

          // Now, send data to your API
          try {
            const token = await SecureStore.getItemAsync("token");
            if (!token) {
              throw new Error("Authentication token not found");
            }

            // 1. First upload the image to your API
            const apiResponse = await fetch(
              "http://192.168.10.30:3000/api/mobile/upload-image",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  publicId: response.public_id,
                  imageUrl: response.secure_url,
                  bodyLocation: bodyLocation,
                  lesionSize: parseFloat(lesionSize),
                  notes: "Uploaded from mobile app",
                }),
              }
            );

            const apiData = await apiResponse.json();

            if (!apiResponse.ok) {
              throw new Error(apiData.error || "Failed to save image data");
            }

            // 2. Now create a lesion case with the uploaded image
            const lesionCaseResponse = await fetch(
              "http://192.168.10.30:3000/api/mobile/lesion-case",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  imageId: apiData.id, // Use the ID from the uploaded image
                  imageUrl: response.secure_url,
                  bodyLocation: bodyLocation,
                  lesionSize: parseFloat(lesionSize),
                  notes: "Uploaded from mobile app",
                }),
              }
            );

            const lesionCaseData = await lesionCaseResponse.json();

            if (!lesionCaseResponse.ok) {
              throw new Error(
                lesionCaseData.error || "Failed to create lesion case"
              );
            }
            setLesionCase(lesionCaseData);
            setUploadSuccess(true);

            // Navigate to results or details page after successful upload
            // setTimeout(() => {
            //   router.push({
            //     pathname: "/lesion-case",
            //     params: {
            //       caseId: lesionCaseData.data.id,
            //       imageUrl: response.secure_url,
            //     },
            //   });
            // }, 1000);
          } catch (apiError) {
            console.error("API upload error:", apiError);
            alert("Failed to save image data. Please try again.");
          } finally {
            setUploading(false);
          }
        },
      });
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image. Please try again.");
      setUploading(false);
    }
  };

  // Permission states
  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-teal-50 dark:bg-slate-900">
        <Text className="text-slate-800 dark:text-white">
          Requesting camera permission...
        </Text>
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-teal-50 dark:bg-slate-900">
        <Text className="text-slate-800 dark:text-white">
          No access to camera
        </Text>
        <Button onPress={requestPermission} className="mt-4">
          Allow Camera
        </Button>
        <Button onPress={pickImage} variant="outline" className="mt-2">
          Select from Gallery
        </Button>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-teal-50 dark:bg-slate-900">
      <ThemeToggle />
      <View className="p-4">
        <Card className="w-full max-w-md mx-auto">
          <View className="px-6 pt-8 pb-4">
            <Text className="text-2xl font-bold mb-1 text-slate-800 dark:text-white">
              Capture Image
            </Text>
            <Text className="text-gray-500 dark:text-gray-400">
              Position within the frame and take a clear photo
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
                flash={isFlashOn ? "on" : "off"}
              >
                <View className="flex-1 border-[40px] border-dashed border-white/30 dark:border-white/20">
                  <View className="flex-1 items-center justify-center">
                    <View className="items-center">
                      <Feather
                        name="camera"
                        size={48}
                        color="rgba(255,255,255,0.5)"
                      />
                      <Text className="text-white opacity-50 mt-4">
                        Position your skin within the frame
                      </Text>
                    </View>
                  </View>
                </View>
              </CameraView>
            )}
          </View>

          {!captured && (
            <View className="px-6 py-4">
              <View className="gap-4">
                <CustomSlider
                  value={lighting}
                  onValueChange={setLighting}
                  label="Lighting"
                  valueLabel="Good"
                  icon={<Feather name="sun" size={16} color="#00c4b4" />}
                />

                {/* Flash toggle button */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 items-center justify-center mr-3">
                      <Feather name="zap" size={16} color="#00c4b4" />
                    </View>
                    <Text className="font-medium text-slate-800 dark:text-white">
                      Flash
                    </Text>
                  </View>
                  <Button
                    variant={isFlashOn ? "primary" : "outline"}
                    onPress={() => setIsFlashOn(!isFlashOn)}
                    className="h-9"
                  >
                    {isFlashOn ? "On" : "Off"}
                  </Button>
                </View>
              </View>

              <View className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
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
            </View>
          )}

          <View className="p-6">
            {captured ? (
              <View className="gap-4">
                {/* Add Body Location and Lesion Size selectors */}
                <View className="mb-4">
                  <Text className="font-medium mb-2 text-slate-800 dark:text-white">
                    Body Location
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

                <View className="mb-4">
                  <Text className="font-medium mb-2 text-slate-800 dark:text-white">
                    Lesion Size (mm)
                  </Text>
                  <TextInput
                    className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-600 text-slate-800 dark:text-white"
                    placeholder="Enter size in millimeters"
                    placeholderTextColor={
                      isDarkColorScheme ? "#94a3b8" : "#64748b"
                    }
                    keyboardType="numeric"
                    value={lesionSize}
                    onChangeText={setLesionSize}
                  />
                </View>

                <View className="flex-row gap-4">
                  <Button
                    variant="outline"
                    onPress={() => {
                      setCaptured(false);
                      setImageUri(null);
                      setUploadSuccess(false);
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
                    Retake
                  </Button>
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
                    disabled={uploading || uploadSuccess}
                  >
                    {uploading
                      ? "Uploading..."
                      : uploadSuccess
                      ? "Uploaded!"
                      : "Upload"}
                  </Button>
                </View>

                {uploadSuccess && (
                  <Button
                    onPress={() => {
                      if (cloudinaryData) {
                        router.push({
                          pathname: "/result-detail",
                          params: { id: lesionCase?.data?.id },
                        });
                      }
                    }}
                    className="mt-3"
                    icon={
                      <Feather name="arrow-right" size={18} color="white" />
                    }
                    iconPosition="right"
                  >
                    Continue
                  </Button>
                )}
              </View>
            ) : (
              <View className="gap-4">
                <Button
                  onPress={takePicture}
                  className="rounded-full py-4"
                  icon={<Feather name="camera" size={20} color="white" />}
                  iconPosition="left"
                >
                  Capture Image
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
                  Select from Gallery
                </Button>
              </View>
            )}
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}
