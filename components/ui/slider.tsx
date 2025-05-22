import type React from "react"
import { View, Text } from "react-native"
import Slider from '@react-native-community/slider';
import { useTheme } from "../theme-provider"

interface CustomSliderProps {
  value: number
  onValueChange: (value: number) => void
  minimumValue?: number
  maximumValue?: number
  step?: number
  label?: string
  valueLabel?: string
  icon?: React.ReactNode
}

export function CustomSlider({
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  label,
  valueLabel,
  icon,
}: CustomSliderProps) {
  const { isDarkMode } = useTheme()

  return (
    <View className="mb-4">
      {(label || valueLabel) && (
        <View className="flex-row justify-between items-center mb-2">
          {label && (
            <View className="flex-row items-center">
              {icon && <View className="mr-2">{icon}</View>}
              <Text className="text-sm font-medium text-slate-800 dark:text-white">{label}</Text>
            </View>
          )}
          {valueLabel && <Text className="text-xs text-gray-500 dark:text-gray-400">{valueLabel}</Text>}
        </View>
      )}
      <Slider
        value={value}
        onValueChange={onValueChange}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        minimumTrackTintColor="#00c4b4" // teal-500
        maximumTrackTintColor={isDarkMode ? "#334155" : "#e2e8f0"} // dark:bg-slate-700 : bg-gray-200
        thumbTintColor="#00c4b4" // teal-500
        thumbStyle={{ width: 16, height: 16, borderRadius: 8 }}
        trackStyle={{ height: 8, borderRadius: 4 }}
      />
    </View>
  )
}
