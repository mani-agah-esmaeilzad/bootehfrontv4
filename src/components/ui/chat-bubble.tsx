// src/components/ui/chat-bubble.tsx

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"

interface ChatBubbleProps {
  message: string
  sender: "user" | "ai"
  isLoading?: boolean
  personaName?: string // پراپرتی جدید برای نام شخصیت
}

export function ChatBubble({ message, sender, isLoading, personaName }: ChatBubbleProps) {
  const isUser = sender === "user";

  return (
    <div className={cn("flex items-start gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src="/ai-character.png" alt="AI" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
        {/* *** FIX: Display persona name if it exists *** */}
        {!isUser && personaName && (
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2">
            {personaName}
          </p>
        )}
        <div
          className={cn(
            "max-w-xs md:max-w-md lg:max-w-lg rounded-2xl p-3 text-sm shadow-md",
            isUser
              ? "bg-hrbooteh-primary text-hrbooteh-primary-foreground rounded-br-none"
              : "bg-hrbooteh-surface-elevated text-hrbooteh-text-primary rounded-bl-none",
            isLoading && "animate-pulse"
          )}
          style={{ whiteSpace: "pre-wrap" }}
        >
          {message}
        </div>
      </div>

      {isUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src="/user-character.png" alt="User" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
