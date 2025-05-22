import { TouchableOpacity, View, Text } from "react-native"
import { Feather } from "@expo/vector-icons"

interface CheckboxProps {
  checked: boolean
  onValueChange: (checked: boolean) => void
  label?: string
  className?: string
  labelClassName?: string
}

export function Checkbox({ checked, onValueChange, label, className = "", labelClassName = "" }: CheckboxProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onValueChange(!checked)}
      className={`flex-row items-center ${className}`}
    >
      <View
        className={`h-5 w-5 rounded border flex items-center justify-center mr-2 
                   ${
                     checked
                       ? "bg-teal-500 border-teal-500"
                       : "border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700"
                   }`}
      >
        {checked && <Feather name="check" size={12} color="white" />}
      </View>
      {label && <Text className={`text-sm text-slate-800 dark:text-white ${labelClassName}`}>{label}</Text>}
    </TouchableOpacity>
  )
}
