// src/pages/AssessmentChat.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import apiFetch from "@/services/apiService";

import avatarUser from "@/assets/avatar1.jpg"; // کاربر
import avatarProctor from "@/assets/avatar2.jpg"; // مبصر
import avatarNarrator from "@/assets/avatar3.jpg"; // راوی

interface ChatMessage {
  id: number;
  text: string;
  sender: "user" | "ai";
  personaName?: string;
}

interface AssessmentState {
  sessionId: string;
  initialMessage: string;
  settings: any;
  personaName: string;
}

const avatars = [
  { src: avatarUser, name: "شما", role: "user" },
  { src: avatarProctor, name: "مبصر", role: "proctor" },
  { src: avatarNarrator, name: "راوی", role: "narrator" },
];

const AssessmentChat = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [assessmentState, setAssessmentState] = useState<AssessmentState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [activeTyping, setActiveTyping] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    try {
      const storedState = sessionStorage.getItem(`assessmentState_${id}`);
      if (storedState) {
        const state: AssessmentState = JSON.parse(storedState);
        setAssessmentState(state);

        const initialAiMessage: ChatMessage = {
          id: Date.now(),
          text: state.initialMessage,
          sender: "ai",
          personaName: state.personaName,
        };
        setMessages([initialAiMessage]);
      } else throw new Error("Session state not found.");
    } catch (error) {
      toast.error("جلسه ارزیابی یافت نشد.");
      setTimeout(() => navigate("/dashboard"), 2000);
    }
  }, [id, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Speech Recognition
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "fa-IR";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setInputValue((prev) => prev + transcript);
          } else {
            interimTranscript += transcript;
          }
        }
      };

      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
    } else {
      toast.error("مرورگر شما از Speech Recognition پشتیبانی نمی‌کند.");
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !assessmentState) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
      personaName: "شما",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setActiveTyping("مشاور");

    try {
      const response = await apiFetch(`assessment/chat/${id}`, {
        method: "POST",
        body: JSON.stringify({ message: userMessage.text, session_id: assessmentState.sessionId }),
      });

      if (response?.success && typeof response.data?.reply === "string") {
        const aiReply = response.data.reply;
        const endSignal = "[END_ASSESSMENT]";

        const aiMessage: ChatMessage = {
          id: Date.now(),
          text: aiReply.replace(endSignal, "").trim(),
          sender: "ai",
          personaName: response.data.personaName,
        };

        setMessages((prev) => [...prev, aiMessage]);

        if (aiReply.includes(endSignal)) {
          toast.info("ارزیابی به پایان رسید. در حال انتقال...");
          setTimeout(() => navigate(`/supplementary/${id}`), 2500);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "خطا در ارتباط با سرور");
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setActiveTyping(null);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (!isRecording) {
      recognitionRef.current.start();
      setIsRecording(true);
    } else {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="relative w-full h-screen flex items-center justify-center chat-background">
      <style>{`
        :root {
          --background: 250 100% 4%;
          --foreground: 250 20% 95%;
          --card: 250 50% 8%;
          --card-foreground: 250 20% 95%;
          --primary: 270 80% 65%;
          --primary-foreground: 0 0% 100%;
          --secondary: 280 60% 55%;
          --muted: 250 30% 15%;
          --muted-foreground: 250 15% 60%;
          --primary-glow: 270 100% 75%;
        }
        .chat-background { background-color: hsl(var(--background)); color: hsl(var(--foreground)); }
        .chat-card { background-color: hsl(var(--card)); color: hsl(var(--card-foreground)); border: 2px solid hsl(var(--primary)); }
        .chat-message-user { 
          background: linear-gradient(135deg,hsl(var(--primary)),hsl(var(--secondary))); 
          color: hsl(var(--primary-foreground)); 
          border-radius: 0.75rem; 
          padding: 0.5rem 0.75rem; 
          max-width: 70%; 
          box-shadow: 0 2px 6px rgba(0,0,0,0.1); 
          text-align: center; 
          transition: all 0.3s ease; 
          font-size: 1rem; 
        }
        .chat-message-ai { 
          background-color: hsl(var(--muted)); 
          color: hsl(var(--muted-foreground)); 
          border-radius: 0.75rem; 
          padding: 0.5rem 0.75rem; 
          max-width: 70%; 
          box-shadow: 0 2px 6px rgba(0,0,0,0.1); 
          text-align: center; 
          transition: all 0.3s ease; 
          font-size: 1rem; 
        }
        .chat-button { background: linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent))); color: hsl(var(--primary-foreground)); }
        .avatar-thinking { animation: typingZoom 0.8s ease-in-out infinite alternate; }
        @keyframes typingZoom {
          0% { transform: scale(1) translateY(0); filter: drop-shadow(0 0 0 hsl(var(--primary-glow))); }
          50% { transform: scale(1.08) translateY(-5%); filter: drop-shadow(0 0 15px hsl(var(--primary-glow))); }
          100% { transform: scale(1) translateY(0); filter: drop-shadow(0 0 0 hsl(var(--primary-glow))); }
        }

        /* موبایل ریسپانسیو */
        @media (max-width: 640px) {
          .chat-message-user, .chat-message-ai {
            font-size: 0.8rem;
            padding: 0.35rem 0.5rem;
            max-width: 85%;
          }
          .chat-card { padding: 1.5rem 0.5rem; }
        }
      `}</style>

      {/* آواتارها */}
      <div className="relative w-[95vmin] h-[95vmin] max-w-4xl max-h-4xl">
        {avatars.map((avatar, index) => {
          const angle = (index * 120 - 90) * (Math.PI / 180);
          const radius = 45;
          const x = 50 + radius * Math.cos(angle);
          const y = 50 + radius * Math.sin(angle);
          const isTyping = activeTyping === avatar.name;

          return (
            <div
              key={avatar.name}
              className={`absolute transition-all duration-500 ${isTyping ? "avatar-thinking" : ""}`}
              style={{ left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%)` }}
            >
              <Avatar className="w-16 h-16 border-2 border-[hsl(var(--primary))] shadow-lg">
                <AvatarImage src={avatar.src} alt={avatar.name} />
                <AvatarFallback>{avatar.name[0]}</AvatarFallback>
              </Avatar>
              <div className="text-center mt-1 text-sm text-[hsl(var(--foreground))]">{avatar.name}</div>
            </div>
          );
        })}

        {/* دایره پیام‌ها */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] flex items-center justify-center">
          <div className="chat-card rounded-full w-full h-full flex items-center justify-center p-4 overflow-hidden">
            <div className="w-full text-center">
              {messages.map((msg) => (
                <div key={msg.id} className="mb-3 flex justify-center">
                  <div className={msg.sender === "user" ? "chat-message-user" : "chat-message-ai"}>
                    {msg.personaName && <strong>{msg.personaName}: </strong>}
                    {msg.text}
                  </div>
                </div>
              ))}
              {activeTyping && (
                <div className="mb-3 flex justify-center">
                  <div className="chat-message-ai">...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* ورودی پیام و میکروفون */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4">
        <div className="relative flex gap-2 items-center chat-card rounded-full p-2 shadow-2xl">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="پیام خود را بنویسید..."
            className="flex-1 border-0 focus-visible:ring-0 text-right rounded-full h-12 px-5 text-sm sm:text-base bg-[hsl(var(--background))]/50"
          />
          <Button onClick={handleSendMessage} size="icon" className="chat-button rounded-full h-12 w-12">
            <Send className="h-5 w-5" />
          </Button>
          <Button onClick={toggleRecording} size="icon" className={`rounded-full h-12 w-12 ${isRecording ? "bg-[hsl(var(--primary-glow))]" : "bg-[hsl(var(--primary))]"}`}>
            <Mic className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentChat;
