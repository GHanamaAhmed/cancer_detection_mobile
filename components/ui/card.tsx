import type React from "react";
import { View, type ViewProps, Text } from "react-native";
import { cn } from "../../lib/utils";

interface CardProps extends ViewProps {
  className?: string;
}

export function Card({ className, style, ...props }: CardProps) {
  return (
    <View
      className={cn(
        "bg-white dark:bg-slate-800 shadow-sm overflow-hidden",
        className
      )}
      style={[{ flex: 1 }, style]}
      {...props}
    />
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return <View className={`p-6 ${className}`}>{children}</View>;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = "" }: CardContentProps) {
  return <View className={`px-6 ${className}`}>{children}</View>;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className = "" }: CardFooterProps) {
  return <View className={`p-6 ${className}`}>{children}</View>;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className = "" }: CardTitleProps) {
  return (
    <Text
      className={`text-2xl font-bold text-slate-800 dark:text-white ${className}`}
    >
      {children}
    </Text>
  );
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({
  children,
  className = "",
}: CardDescriptionProps) {
  return (
    <Text className={`text-gray-500 dark:text-gray-400 ${className}`}>
      {children}
    </Text>
  );
}
