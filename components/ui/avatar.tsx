import { View, Image, Text } from "react-native"

interface AvatarProps {
  source?: string
  fallback?: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function Avatar({ source, fallback, size = "md", className = "" }: AvatarProps) {
  const sizeClass = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }[size]

  const fontSizeClass = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  }[size]

  return (
    <View className={`rounded-full overflow-hidden ${sizeClass} ${className}`}>
      {source ? (
        <Image source={{ uri: source }} className="w-full h-full" resizeMode="cover" />
      ) : (
        <View className="w-full h-full bg-gray-300 dark:bg-gray-600 items-center justify-center">
          {fallback && (
            <Text className={`font-medium text-gray-600 dark:text-gray-300 ${fontSizeClass}`}>
              {fallback.substring(0, 2).toUpperCase()}
            </Text>
          )}
        </View>
      )}
    </View>
  )
}
