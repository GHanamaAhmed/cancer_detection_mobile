import type React from "react"
import { View, Text } from "react-native"

interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "outline" | "success" | "warning" | "danger"
  className?: string
  textClassName?: string
}

export function Badge({ children, variant = "default", className = "", textClassName = "" }: BadgeProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "outline":
        return "bg-transparent border border-gray-200 dark:border-gray-700"
      case "success":
        return "bg-green-100 dark:bg-green-900/30"
      case "warning":
        return "bg-amber-100 dark:bg-amber-900/30"
      case "danger":
        return "bg-red-100 dark:bg-red-900/30"
      default:
        return "bg-gray-100 dark:bg-gray-800"
    }
  }

  const getTextClasses = () => {
    switch (variant) {
      case "outline":
        return "text-gray-700 dark:text-gray-300"
      case "success":
        return "text-green-800 dark:text-green-300"
      case "warning":
        return "text-amber-800 dark:text-amber-300"
      case "danger":
        return "text-red-800 dark:text-red-300"
      default:
        return "text-gray-700 dark:text-gray-300"
    }
  }

  return (
    <View className={`px-2 py-0.5 rounded-full ${getVariantClasses()} ${className}`}>
      <Text className={`text-xs font-medium ${getTextClasses()} ${textClassName}`}>{children}</Text>
    </View>
  )
}
