import type React from "react"
import { TextInput, View, Text, type TextInputProps } from "react-native"
import { useTheme } from "../theme-provider"

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  className?: string
  labelClassName?: string
  errorClassName?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function Input({
  label,
  error,
  className = "",
  labelClassName = "",
  errorClassName = "",
  leftIcon,
  rightIcon,
  ...props
}: InputProps) {
  const { isDarkMode } = useTheme()

  return (
    <View className="mb-4">
      {label && (
        <Text className={`text-sm font-medium mb-1.5 text-slate-800 dark:text-white ${labelClassName}`}>{label}</Text>
      )}
      <View className="relative">
        {leftIcon && <View className="absolute left-3 top-1/2 -translate-y-1/2 z-10">{leftIcon}</View>}
        <TextInput
          className={`w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 
                     bg-white dark:bg-slate-700 text-slate-800 dark:text-white
                     ${leftIcon ? "pl-10" : ""} ${rightIcon ? "pr-10" : ""} ${className}`}
          placeholderTextColor={isDarkMode ? "#94a3b8" : "#94a3b8"}
          {...props}
        />
        {rightIcon && <View className="absolute right-3 top-1/2 -translate-y-1/2 z-10">{rightIcon}</View>}
      </View>
      {error && <Text className={`text-xs text-red-500 mt-1 ${errorClassName}`}>{error}</Text>}
    </View>
  )
}
