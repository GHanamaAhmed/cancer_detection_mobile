import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
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
import i18n from "~/i18n";
import { ThemeToggle } from "~/components/theme-toggle";
import { SwitchLanguage } from "~/components/langugesSwitcher";

type ForgotPasswordStep = "email" | "verification" | "newPassword";

export default function WelcomeScreen() {
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

  // Add these states to WelcomeScreen component:
  const [registrationStep, setRegistrationStep] = useState<
    "form" | "verification"
  >("form");
  const [registrationCode, setRegistrationCode] = useState("");
  const [registrationData, setRegistrationData] = useState({
    fullName: "",
    email: "",
    password: "",
    agreeToTerms: false,
  });

  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [isSendVerificationLoading, setIsSendVerificationLoading] =
    useState(false);
  const [isVerifyCodeLoading, setIsVerifyCodeLoading] = useState(false);
  const [isResetPasswordLoading, setIsResetPasswordLoading] = useState(false);
  const [isSendRegistrationCodeLoading, setIsSendRegistrationCodeLoading] =
    useState(false);

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
    setIsLoginLoading(true);

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
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    // In a real app, integrate Google authentication
    console.log("Google authentication initiated");
    // After successful authentication:
    router.replace("/(tabs)/home");
  };

  const handleSendRegistrationCode = async () => {
    if (!registerEmail) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setIsSendRegistrationCodeLoading(true);
    try {
      const res = await fetch(
        `${ENV.API_URL}/api/mobile/auth/send-verification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: registerEmail }),
        }
      );

      const data = await res.json();

      if (data.success) {
        // Store registration data for later
        setRegistrationData({
          fullName: registerFullName,
          email: registerEmail,
          password: registerPassword,
          agreeToTerms,
        });

        // Move to verification step
        setRegistrationStep("verification");
      } else {
        Alert.alert("Error", data.error || "Failed to send verification code");
      }
    } catch (error) {
      console.error("Error sending verification code:", error);
      Alert.alert("Error", "Failed to send verification code");
    } finally {
      setIsSendRegistrationCodeLoading(false);
    }
  };

  // Update the register function to use the verification code
  const handleRegister = async () => {
    setIsRegisterLoading(true);
    try {
      const res = await fetch(`${ENV.API_URL}/api/mobile/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: registrationData.fullName,
          email: registrationData.email,
          password: registrationData.password,
          verificationCode: registrationCode,
          agreeToTerms: registrationData.agreeToTerms,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Save token and refresh token securely
        await saveTokens(data.data.token, data.data.refreshToken);
        await SecureStore.setItemAsync("user", JSON.stringify(data.data.user));

        // Navigate to home
        router.replace("/(tabs)/home");
      } else {
        Alert.alert(
          "Registration Failed",
          data.error || "Please check your information and try again."
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert("Error", "An error occurred during registration");
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const handleSendVerificationCode = async () => {
    setIsSendVerificationLoading(true);
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
    } finally {
      setIsSendVerificationLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setIsVerifyCodeLoading(true);
    try {
      const res = await fetch(`${ENV.API_URL}/api/mobile/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotPasswordEmail,
          code: verificationCode,
        }),
      });
      if (res.ok) {
        console.log(`Verification code ${verificationCode} verified`);
        setForgotPasswordStep("newPassword");
      } else {
        Alert.alert("Verification Failed", "The code is incorrect or expired.");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred during code verification");
    } finally {
      setIsVerifyCodeLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmNewPassword) {
      Alert.alert("Password Mismatch", "New passwords do not match");
      return;
    }

    setIsResetPasswordLoading(true);
    try {
      const res = await fetch(`${ENV.API_URL}/api/mobile/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotPasswordEmail,
          newPassword,
          code: verificationCode,
        }),
      });
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
    } finally {
      setIsResetPasswordLoading(false);
    }
  };

  const renderForgotPasswordContent = () => {
    switch (forgotPasswordStep) {
      case "email":
        return (
          <>
            <CardHeader>
              <CardTitle className="text-center">
                {i18n.t("auth.auth.forgotPassword.title")}
              </CardTitle>
              <CardDescription className="text-center">
                {i18n.t("auth.auth.forgotPassword.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Input
                label={i18n.t("auth.auth.forgotPassword.emailPlaceholder")}
                placeholder={i18n.t("auth.auth.forgotPassword.emailPlaceholder")}
                keyboardType="email-address"
                autoCapitalize="none"
                value={forgotPasswordEmail}
                onChangeText={setForgotPasswordEmail}
                editable={!isSendVerificationLoading}
              />
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button
                onPress={handleSendVerificationCode}
                disabled={isSendVerificationLoading || !forgotPasswordEmail}
              >
                {isSendVerificationLoading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#fff" />
                    <Text className="text-white ml-2">
                      {i18n.t("auth.auth.forgotPassword.sending")}
                    </Text>
                  </View>
                ) : (
                  i18n.t("auth.auth.forgotPassword.sendCode")
                )}
              </Button>
              <Button
                variant="outline"
                onPress={() => setShowForgotPassword(false)}
                disabled={isSendVerificationLoading}
              >
                {i18n.t("auth.auth.forgotPassword.backToLogin")}
              </Button>
            </CardFooter>
          </>
        );
      case "verification":
        return (
          <>
            <CardHeader>
              <CardTitle className="text-center">
                {i18n.t("auth.auth.forgotPassword.verification.title")}
              </CardTitle>
              <CardDescription className="text-center">
                {i18n.t("auth.auth.forgotPassword.verification.subtitle", {
                  email: forgotPasswordEmail,
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Input
                label={i18n.t("auth.auth.forgotPassword.verification.codeLabel")}
                placeholder={i18n.t(
                  "auth.forgotPassword.verification.codePlaceholder"
                )}
                keyboardType="number-pad"
                value={verificationCode}
                onChangeText={setVerificationCode}
                editable={!isVerifyCodeLoading}
              />
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button
                onPress={handleVerifyCode}
                disabled={isVerifyCodeLoading || !verificationCode}
              >
                {isVerifyCodeLoading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#fff" />
                    <Text className="text-white ml-2">
                      {i18n.t("auth.auth.forgotPassword.verification.verifying")}
                    </Text>
                  </View>
                ) : (
                  i18n.t("auth.auth.forgotPassword.verification.verify")
                )}
              </Button>
              <Button
                variant="outline"
                onPress={() => setForgotPasswordStep("email")}
                className="mt-2"
                disabled={isVerifyCodeLoading}
              >
                {i18n.t("common.back")}
              </Button>
            </CardFooter>
          </>
        );
      case "newPassword":
        return (
          <>
            <CardHeader>
              <CardTitle className="text-center">
                {i18n.t("auth.auth.forgotPassword.resetPassword.title")}
              </CardTitle>
              <CardDescription className="text-center">
                {i18n.t("auth.auth.forgotPassword.resetPassword.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Input
                label={i18n.t(
                  "auth.forgotPassword.resetPassword.newPasswordLabel"
                )}
                placeholder={i18n.t(
                  "auth.forgotPassword.resetPassword.newPasswordPlaceholder"
                )}
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                editable={!isResetPasswordLoading}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isResetPasswordLoading}
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
                label={i18n.t(
                  "auth.forgotPassword.resetPassword.confirmPasswordLabel"
                )}
                placeholder={i18n.t(
                  "auth.forgotPassword.resetPassword.confirmPasswordPlaceholder"
                )}
                secureTextEntry={!showPassword}
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                editable={!isResetPasswordLoading}
              />
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button
                onPress={handleResetPassword}
                disabled={
                  isResetPasswordLoading || !newPassword || !confirmNewPassword
                }
              >
                {isResetPasswordLoading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#fff" />
                    <Text className="text-white ml-2">
                      {i18n.t("auth.auth.forgotPassword.resetPassword.resetting")}
                    </Text>
                  </View>
                ) : (
                  i18n.t("auth.auth.forgotPassword.resetPassword.resetButton")
                )}
              </Button>
              <Button
                variant="outline"
                onPress={() => setForgotPasswordStep("verification")}
                className="mt-2"
                disabled={isResetPasswordLoading}
              >
                {i18n.t("common.back")}
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
      <SwitchLanguage />
      <View className="py-8 w-full">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 pb-8">
            <CardTitle className="text-center">
              {i18n.t("auth.welcome.title")}
            </CardTitle>
            <CardDescription className="text-center">
              {i18n.t("auth.welcome.subtitle")}
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
                {i18n.t("auth.tabs.login")}
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
                {i18n.t("auth.tabs.register")}
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === "login" ? (
            <>
              <CardContent className="pt-6">
                <Input
                  label={i18n.t("auth.auth.login.email")}
                  placeholder={i18n.t("auth.auth.login.emailPlaceholder")}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                />
                <Input
                  label={i18n.t("auth.auth.login.password")}
                  placeholder={i18n.t("auth.auth.login.passwordPlaceholder")}
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
                    label={i18n.t("auth.auth.login.rememberMe")}
                  />
                  <TouchableOpacity onPress={() => setShowForgotPassword(true)}>
                    <Text className="text-xs text-teal-500">
                      {i18n.t("auth.auth.login.forgotPassword")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button
                  onPress={handleLogin}
                  icon={
                    isLoginLoading ? null : (
                      <Feather name="arrow-right" size={18} color="white" />
                    )
                  }
                  iconPosition="right"
                  disabled={isLoginLoading || !loginEmail || !loginPassword}
                >
                  {isLoginLoading ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator size="small" color="#fff" />
                      <Text className="text-white ml-2">
                        {i18n.t("auth.auth.login.signingIn")}
                      </Text>
                    </View>
                  ) : (
                    i18n.t("auth.auth.login.signIn")
                  )}
                </Button>

                <View className="items-center mt-2">
                  <Text className="text-center text-sm text-gray-500 dark:text-gray-400">
                    {i18n.t("auth.auth.login.noAccount")}{" "}
                    <Text
                      className="text-teal-500"
                      onPress={() => setActiveTab("register")}
                    >
                      {i18n.t("auth.auth.login.signUp")}
                    </Text>
                  </Text>
                </View>
              </CardFooter>
            </>
          ) : (
            <>
              <CardContent className="pt-6">
                <Input
                  label={i18n.t("auth.auth.register.fullName")}
                  placeholder={i18n.t("auth.auth.register.fullNamePlaceholder")}
                  value={registerFullName}
                  onChangeText={setRegisterFullName}
                />

                <Input
                  label={i18n.t("auth.auth.register.email")}
                  placeholder={i18n.t("auth.auth.register.emailPlaceholder")}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={registerEmail}
                  onChangeText={setRegisterEmail}
                />
                <Input
                  label={i18n.t("auth.auth.register.password")}
                  placeholder={i18n.t("auth.auth.register.passwordPlaceholder")}
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
                    label={i18n.t("auth.auth.register.termsAgreement")}
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
                  {i18n.t("auth.auth.register.createAccount")}
                </Button>

                <View className="flex-row items-center my-2">
                  <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <Text className="mx-4 text-xs text-gray-500 dark:text-gray-400">
                    {i18n.t("auth.common.or")}
                  </Text>
                  <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </View>

                {/* <Button
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
                  {i18n.t('auth.register.signUpWithGoogle')}
                </Text>
              </Button> */}

                <View className="items-center mt-2">
                  <Text className="text-center text-sm text-gray-500 dark:text-gray-400">
                    {i18n.t("auth.auth.register.haveAccount")}{" "}
                    <Text
                      className="text-teal-500"
                      onPress={() => setActiveTab("login")}
                    >
                      {i18n.t("auth.auth.register.signIn")}
                    </Text>
                  </Text>
                </View>
              </CardFooter>
            </>
          )}

          {activeTab === "register" && registrationStep === "form" ? (
            <CardFooter className="flex-col gap-2">
              <Button
                onPress={handleSendRegistrationCode}
                icon={
                  isSendRegistrationCodeLoading ? null : (
                    <Feather name="mail" size={18} color="white" />
                  )
                }
                iconPosition="right"
                disabled={
                  isSendRegistrationCodeLoading ||
                  !registerEmail ||
                  !registerFullName ||
                  !registerPassword ||
                  !agreeToTerms
                }
              >
                {isSendRegistrationCodeLoading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#fff" />
                    <Text className="text-white ml-2">
                      {i18n.t("auth.auth.register.sending")}
                    </Text>
                  </View>
                ) : (
                  i18n.t("auth.auth.register.verifyEmail")
                )}
              </Button>

              <View className="px-6 pb-6 pt-2 border-t border-gray-100 dark:border-gray-700 mt-4">
                <Text className="text-center font-medium mb-4 text-slate-800 dark:text-white">
                  {i18n.t("auth.auth.register.whyCreateAccount.title")}
                </Text>
                <View className="gap-3">
                  <View className="flex-row">
                    <View className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-lg mr-3">
                      <Feather name="check-circle" size={20} color="#00c4b4" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-slate-800 dark:text-white">
                        {i18n.t(
                          "auth.register.whyCreateAccount.tracking.title"
                        )}
                      </Text>
                      <Text className="text-sm text-gray-500 dark:text-gray-400">
                        {i18n.t(
                          "auth.register.whyCreateAccount.tracking.description"
                        )}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row">
                    <View className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-lg mr-3">
                      <Feather name="shield" size={20} color="#00c4b4" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-slate-800 dark:text-white">
                        {i18n.t(
                          "auth.auth.register.whyCreateAccount.security.title"
                        )}
                      </Text>
                      <Text className="text-sm text-gray-500 dark:text-gray-400">
                        {i18n.t(
                          "auth.auth.register.whyCreateAccount.security.description"
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </CardFooter>
          ) : activeTab === "register" &&
            registrationStep === "verification" ? (
            // Display the verification form
            <>
              <CardHeader>
                <CardTitle className="text-center">
                  {i18n.t("auth.auth.register.verification.title")}
                </CardTitle>
                <CardDescription className="text-center">
                  {i18n.t("auth.auth.register.verification.subtitle", {
                    email: registrationData.email,
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Input
                  label={i18n.t("auth.auth.register.verification.codeLabel")}
                  placeholder={i18n.t(
                    "auth.register.verification.codePlaceholder"
                  )}
                  keyboardType="number-pad"
                  value={registrationCode}
                  onChangeText={setRegistrationCode}
                />
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button
                  onPress={handleRegister}
                  icon={
                    isRegisterLoading ? null : (
                      <Feather name="shield" size={18} color="white" />
                    )
                  }
                  iconPosition="right"
                  disabled={isRegisterLoading || !registrationCode}
                >
                  {isRegisterLoading ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator size="small" color="#fff" />
                      <Text className="text-white ml-2">
                        {i18n.t("auth.auth.register.creatingAccount")}
                      </Text>
                    </View>
                  ) : (
                    i18n.t("auth.auth.register.createAccount")
                  )}
                </Button>
                <Button
                  variant="outline"
                  onPress={() => setRegistrationStep("form")}
                  className="mt-2"
                >
                  {i18n.t("auth.common.back")}
                </Button>
              </CardFooter>
            </>
          ) : null}
        </Card>
      </View>
    </ScrollView>
  );
}
