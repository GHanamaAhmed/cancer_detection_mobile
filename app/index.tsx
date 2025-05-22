
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { useColorScheme } from "~/lib/useColorScheme";
import { AuthResponse } from "~/types/mobile-api";
import ENV from "~/lib/env";

type ForgotPasswordStep = "email" | "verification" | "newPassword";

export default function WelcomeScreen() {
  console.log("env", process.env.API_URL);

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { isDarkColorScheme: isDarkMode } = useColorScheme();

  // Login & register form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerFullName, setRegisterFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] =
    useState<ForgotPasswordStep>("email");
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    try {
    } catch (error) {}
    SecureStore.getItemAsync("token")
      .then(async (token) => {
        if (!token) {
          console.error("No token found");
          return;
        }
        const res = await fetch(`${ENV.API_URL}/api/mobile/user/profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          console.error("Failed to fetch user profile");
          return;
        }
        router.replace("/(tabs)/home");
      })
      .catch()
      .finally(() => setIsLoading(false));
  }, []);
  // Use expo-secure-store for secure storage of tokens
  const saveTokens = async (token: string, refreshToken: string) => {
    try {
      await SecureStore.setItemAsync("token", token);
      await SecureStore.setItemAsync("refreshToken", refreshToken);
    } catch (e) {
      console.log("Error saving tokens:", e);
    }
  };

  const handleLogin = async () => {
    console.log("Login button pressed");

    try {
      const res = await fetch(`${ENV.API_URL}/api/mobile/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          rememberMe,
        }),
      });
      if (res.ok) {
        const result: {
          data: AuthResponse;
        } = await res.json();
        // Save token and refresh token securely
        console.log("Login successful:", result);
        await saveTokens(result.data.token, result.data.refreshToken);
        await SecureStore.setItemAsync(
          "user",
          JSON.stringify(result.data.user)
        );
        console.log("Tokens saved successfully");

        // On success, navigate to home
        router.replace("/(tabs)/home");
      } else {
        Alert.alert("Login Failed", "Invalid credentials. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred during login");
    }
  };

  const handleGoogleAuth = async () => {
    // In a real app, integrate Google authentication
    console.log("Google authentication initiated");
    // After successful authentication:
    router.replace("/(tabs)/home");
  };

  const handleRegister = async () => {
    try {
      const res = await fetch(
        `${ENV.API_URL}/api/mobile/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: registerFullName,
            email: registerEmail,
            password: registerPassword,
            agreeToTerms,
          }),
        }
      );
      if (res.ok) {
        const result = await res.json();
        // Save token and refresh token securely
        await saveTokens(result.data.token, result.data.refreshToken);
        // Optionally auto-login or navigate after registration
        router.replace("/(tabs)/home");
      } else {
        Alert.alert(
          "Registration Failed",
          "Please check your information and try again."
        );
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred during registration");
    }
  };

  const handleSendVerificationCode = async () => {
    try {
      const res = await fetch(
        `${ENV.API_URL}/api/mobile/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotPasswordEmail }),
        }
      );
      if (res.ok) {
        console.log(`Verification code sent to ${forgotPasswordEmail}`);
        setForgotPasswordStep("verification");
      } else {
        Alert.alert("Request Failed", "Unable to send verification code.");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while sending verification code");
    }
  };

  const handleVerifyCode = async () => {
    try {
      const res = await fetch(
        `${ENV.API_URL}/api/mobile/auth/verify-code`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: forgotPasswordEmail,
            code: verificationCode,
          }),
        }
      );
      if (res.ok) {
        console.log(`Verification code ${verificationCode} verified`);
        setForgotPasswordStep("newPassword");
      } else {
        Alert.alert("Verification Failed", "The code is incorrect or expired.");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred during code verification");
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmNewPassword) {
      Alert.alert("Password Mismatch", "New passwords do not match");
      return;
    }
    try {
      const res = await fetch(
        `${ENV.API_URL}/api/mobile/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotPasswordEmail, newPassword }),
        }
      );
      if (res.ok) {
        console.log(`Password has been reset`);
        Alert.alert("Success", "Password has been reset successfully");
        setShowForgotPassword(false);
        setActiveTab("login");
        // reset forgot password state
        setForgotPasswordStep("email");
        setForgotPasswordEmail("");
        setVerificationCode("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        Alert.alert(
          "Reset Failed",
          "Unable to reset password. Try again later."
        );
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred during password reset");
    }
  };

  const renderForgotPasswordContent = () => {
    switch (forgotPasswordStep) {
      case "email":
        return (
          <>
            <CardHeader>
              <CardTitle className="text-center">Forgot Password</CardTitle>
              <CardDescription className="text-center">
                Enter your email address and we'll send you a verification code
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Input
                label="Email"
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={forgotPasswordEmail}
                onChangeText={setForgotPasswordEmail}
              />
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button onPress={handleSendVerificationCode}>
                Send Verification Code
              </Button>
              <Button
                variant="outline"
                onPress={() => setShowForgotPassword(false)}
              >
                Back to Login
              </Button>
            </CardFooter>
          </>
        );
      case "verification":
        return (
          <>
            <CardHeader>
              <CardTitle className="text-center">Verify Code</CardTitle>
              <CardDescription className="text-center">
                Enter the verification code sent to {forgotPasswordEmail}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Input
                label="Verification Code"
                placeholder="Enter verification code"
                keyboardType="number-pad"
                value={verificationCode}
                onChangeText={setVerificationCode}
              />
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button onPress={handleVerifyCode}>Verify Code</Button>
              <Button
                variant="outline"
                onPress={() => setForgotPasswordStep("email")}
                className="mt-2"
              >
                Back
              </Button>
            </CardFooter>
          </>
        );
      case "newPassword":
        return (
          <>
            <CardHeader>
              <CardTitle className="text-center">Reset Password</CardTitle>
              <CardDescription className="text-center">
                Create a new password for your account
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Input
                label="New Password"
                placeholder="Enter new password"
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Feather
                      name={showPassword ? "eye-off" : "eye"}
                      size={18}
                      color={isDarkMode ? "#94a3b8" : "#64748b"}
                    />
                  </TouchableOpacity>
                }
              />
              <Input
                label="Confirm New Password"
                placeholder="Confirm new password"
                secureTextEntry={!showPassword}
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
              />
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button onPress={handleResetPassword}>Reset Password</Button>
              <Button
                variant="outline"
                onPress={() => setForgotPasswordStep("verification")}
                className="mt-2"
              >
                Back
              </Button>
            </CardFooter>
          </>
        );
    }
  };

  if (showForgotPassword) {
    return (
      <ScrollView
        className="flex-1 bg-teal-50 dark:bg-slate-900 p-4"
        contentContainerStyle={{
          flexGrow: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View className="py-8 w-full">
          <Card className="w-full max-w-md mx-auto">
            {renderForgotPasswordContent()}
          </Card>
        </View>
      </ScrollView>
    );
  }

  return isLoading ? (
    <View></View>
  ) : (
    <ScrollView
      className="flex-1 bg-teal-50 dark:bg-slate-900 p-4"
      contentContainerStyle={{
        flexGrow: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View className="py-8 w-full">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 pb-8">
            <CardTitle className="text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>

          <View className="flex-row border-b border-gray-100 dark:border-gray-700">
            <TouchableOpacity
              className={`flex-1 py-3 items-center ${
                activeTab === "login" ? "border-b-2 border-teal-500" : ""
              }`}
              onPress={() => setActiveTab("login")}
            >
              <Text
                className={`font-medium ${
                  activeTab === "login"
                    ? "text-teal-500"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 items-center ${
                activeTab === "register" ? "border-b-2 border-teal-500" : ""
              }`}
              onPress={() => setActiveTab("register")}
            >
              <Text
                className={`font-medium ${
                  activeTab === "register"
                    ? "text-teal-500"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === "login" ? (
            <>
              <CardContent className="pt-6">
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                />
                <Input
                  label="Password"
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  rightIcon={
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Feather
                        name={showPassword ? "eye-off" : "eye"}
                        size={18}
                        color={isDarkMode ? "#94a3b8" : "#64748b"}
                      />
                    </TouchableOpacity>
                  }
                />
                <View className="flex-row justify-between items-center mb-4">
                  <Checkbox
                    checked={rememberMe}
                    onValueChange={setRememberMe}
                    label="Remember me"
                  />
                  <TouchableOpacity onPress={() => setShowForgotPassword(true)}>
                    <Text className="text-xs text-teal-500">
                      Forgot password?
                    </Text>
                  </TouchableOpacity>
                </View>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button
                  onPress={handleLogin}
                  icon={<Feather name="arrow-right" size={18} color="white" />}
                  iconPosition="right"
                >
                  Sign In
                </Button>

                <View className="flex-row items-center my-2">
                  <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <Text className="mx-4 text-xs text-gray-500 dark:text-gray-400">
                    OR
                  </Text>
                  <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </View>

                <Button
                  variant="outline"
                  onPress={handleGoogleAuth}
                  className="bg-white dark:bg-transparent"
                  icon={
                    <Image
                      source={{
                        uri: "https://developers.google.com/identity/images/g-logo.png",
                      }}
                      style={{ width: 18, height: 18 }}
                    />
                  }
                  iconPosition="left"
                >
                  <Text className="text-slate-800 dark:text-white">
                    Continue with Google
                  </Text>
                </Button>

                <View className="items-center mt-2">
                  <Text className="text-center text-sm text-gray-500 dark:text-gray-400">
                    Don't have an account?{" "}
                    <Text
                      className="text-teal-500"
                      onPress={() => setActiveTab("register")}
                    >
                      Sign up
                    </Text>
                  </Text>
                </View>
              </CardFooter>
            </>
          ) : (
            <>
              <CardContent className="pt-6">
                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={registerFullName}
                  onChangeText={setRegisterFullName}
                />

                <Text className="text-sm font-medium mb-1.5 text-slate-800 dark:text-white">
                  Sign up with
                </Text>
                <View className="flex-row gap-4 mb-4">
                  <Button
                    variant="outline"
                    onPress={() => {}}
                    className="flex-1"
                    icon={<Feather name="mail" size={18} color="#00c4b4" />}
                    iconPosition="left"
                  >
                    Email
                  </Button>
                  <Button
                    variant="outline"
                    onPress={() => {}}
                    className="flex-1"
                    icon={<Feather name="phone" size={18} color="#00c4b4" />}
                    iconPosition="left"
                  >
                    Phone
                  </Button>
                </View>

                <Input
                  label="Email"
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={registerEmail}
                  onChangeText={setRegisterEmail}
                />
                <Input
                  label="Password"
                  placeholder="Create a password"
                  secureTextEntry={!showPassword}
                  value={registerPassword}
                  onChangeText={setRegisterPassword}
                  rightIcon={
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Feather
                        name={showPassword ? "eye-off" : "eye"}
                        size={18}
                        color={isDarkMode ? "#94a3b8" : "#64748b"}
                      />
                    </TouchableOpacity>
                  }
                />
                <View className="mb-4">
                  <Checkbox
                    checked={agreeToTerms}
                    onValueChange={setAgreeToTerms}
                    label="I agree to the Terms of Service and Privacy Policy"
                    labelClassName="flex-shrink"
                  />
                </View>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button
                  onPress={handleRegister}
                  icon={<Feather name="shield" size={18} color="white" />}
                  iconPosition="right"
                >
                  Create Account
                </Button>

                <View className="flex-row items-center my-2">
                  <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <Text className="mx-4 text-xs text-gray-500 dark:text-gray-400">
                    OR
                  </Text>
                  <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </View>

                <Button
                  variant="outline"
                  onPress={handleGoogleAuth}
                  className="bg-white dark:bg-transparent"
                  icon={
                    <Image
                      source={{
                        uri: "https://developers.google.com/identity/images/g-logo.png",
                      }}
                      style={{ width: 18, height: 18 }}
                    />
                  }
                  iconPosition="left"
                >
                  <Text className="text-slate-800 dark:text-white">
                    Sign up with Google
                  </Text>
                </Button>

                <View className="items-center mt-2">
                  <Text className="text-center text-sm text-gray-500 dark:text-gray-400">
                    Already have an account?{" "}
                    <Text
                      className="text-teal-500"
                      onPress={() => setActiveTab("login")}
                    >
                      Sign in
                    </Text>
                  </Text>
                </View>
              </CardFooter>
            </>
          )}

          {activeTab === "register" && (
            <View className="px-6 pb-6 pt-2 border-t border-gray-100 dark:border-gray-700 mt-4">
              <Text className="text-center font-medium mb-4 text-slate-800 dark:text-white">
                Why create an account?
              </Text>
              <View className="gap-3">
                <View className="flex-row">
                  <View className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-lg mr-3">
                    <Feather name="check-circle" size={20} color="#00c4b4" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-slate-800 dark:text-white">
                      Personalized Health Tracking
                    </Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                      Monitor your health progress over time
                    </Text>
                  </View>
                </View>
                <View className="flex-row">
                  <View className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-lg mr-3">
                    <Feather name="shield" size={20} color="#00c4b4" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-slate-800 dark:text-white">
                      Secure Data Storage
                    </Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                      Your health data is encrypted and protected
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </Card>
      </View>
    </ScrollView>
  );
}
