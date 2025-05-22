import type React from "react"
import { Text, TouchableOpacity, ActivityIndicator, View } from "react-native"
import { useTheme } from "../theme-provider"

interface ButtonProps {
  onPress: () => void
  children: React.ReactNode
  variant?: "primary" | "outline" | "ghost" | "destructive"
  className?: string
  textClassName?: string
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
}

export function Button({
  onPress,
  children,
  variant = "primary",
  className = "",
  textClassName = "",
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
}: ButtonProps) {
  const { isDarkMode } = useTheme()

  const getButtonClasses = () => {
    const baseClasses = "flex-row items-center justify-center rounded-xl py-3 px-4 "

    if (disabled) {
      return baseClasses + "opacity-50 " + className
    }

    switch (variant) {
      case "primary":
        return baseClasses + "bg-teal-500 " + className
      case "outline":
        return baseClasses + "border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-700 " + className
      case "ghost":
        return baseClasses + "bg-transparent " + className
      case "destructive":
        return baseClasses + "bg-red-500 " + className
      default:
        return baseClasses + className
    }
  }

  const getTextClasses = () => {
    const baseClasses = "font-medium text-base "

    switch (variant) {
      case "primary":
        return baseClasses + "text-white " + textClassName
      case "outline":
        return baseClasses + "text-slate-800 dark:text-white " + textClassName
      case "ghost":
        return baseClasses + "text-slate-800 dark:text-white " + textClassName
      case "destructive":
        return baseClasses + "text-white " + textClassName
      default:
        return baseClasses + textClassName
    }
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={getButtonClasses()}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" || variant === "ghost" ? (isDarkMode ? "#fff" : "#334155") : "#fff"}
        />
      ) : (
        <>
          {icon && iconPosition === "left" && <View className="mr-2">{icon}</View>}
          <Text className={getTextClasses()}>{children}</Text>
          {icon && iconPosition === "right" && <View className="ml-2">{icon}</View>}
        </>
      )}
    </TouchableOpacity>
  )
}
