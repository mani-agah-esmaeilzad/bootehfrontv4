// src/pages/AssessmentChat.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import apiFetch from "@/services/apiService";
import { cn } from "@/lib/utils";

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

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const isUserTurn = lastMessage ? lastMessage.sender === "ai" : Boolean(assessmentState);

  return (
    <div className="relative flex h-screen w-full items-center justify-center bg-[#f7f9fc] text-slate-900">
      <style>{`
        @keyframes chat-wiggle {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-2px); }
          75% { transform: translateY(2px); }
        }
      `}</style>
      {/* آواتارها */}
      <div className="relative h-[95vmin] w-[95vmin] max-h-4xl max-w-4xl">
        {avatars.map((avatar, index) => {
          const angle = (index * 120 - 90) * (Math.PI / 180);
          const radius = 45;
          const x = 50 + radius * Math.cos(angle);
          const y = 50 + radius * Math.sin(angle);
          const isTyping = activeTyping === avatar.name;
          const shouldWiggle =
            (avatar.role === "user" && isUserTurn) ||
            (avatar.role === "narrator" && activeTyping === avatar.name);

          return (
            <div
              key={avatar.name}
              className={cn(
                "absolute flex flex-col items-center gap-2 transition-all duration-500",
                isTyping && "scale-[1.05]"
              )}
              style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
            >
              <div className={cn(shouldWiggle && "animate-[chat-wiggle_0.9s_ease-in-out_infinite]")}>
                <Avatar className="h-16 w-16 border border-slate-200 bg-white shadow-sm">
                  <AvatarImage src={avatar.src} alt={avatar.name} />
                  <AvatarFallback>{avatar.name[0]}</AvatarFallback>
                </Avatar>
              </div>
              <div className="text-center text-xs font-medium text-slate-500">{avatar.name}</div>
            </div>
          );
        })}

        {/* دایره پیام‌ها */}
        <div className="absolute left-1/2 top-1/2 flex h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          <div className="flex h-full w-full items-center justify-center rounded-full border border-slate-200 bg-white/80 shadow-sm backdrop-blur">
            <div className="flex h-[82%] w-[82%] flex-col items-center overflow-hidden rounded-full px-6 py-6">
              <div className="flex w-full flex-1 flex-col items-center gap-3 overflow-y-auto pe-3 text-center">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex justify-center">
                    <div
                      className={cn(
                        "max-w-[75%] rounded-3xl border px-5 py-3 text-sm leading-relaxed shadow-sm",
                        msg.sender === "user"
                          ? "border-sky-100 bg-sky-50 text-sky-700"
                          : "border-slate-200 bg-white text-slate-600"
                      )}
                    >
                      {msg.personaName && <strong>{msg.personaName}: </strong>}
                      {msg.text}
                    </div>
                  </div>
                ))}
                {activeTyping && (
                  <div className="flex justify-center">
                    <div className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-400 shadow-sm">
                      ...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ورودی پیام و میکروفون */}
      <div className="fixed bottom-6 left-1/2 w-full max-w-2xl -translate-x-1/2 px-4">
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-2 shadow-lg">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="پیام خود را بنویسید..."
            className="h-12 flex-1 rounded-full border-none bg-transparent px-5 text-right text-sm text-slate-600 focus-visible:ring-0"
          />
          <Button
            onClick={handleSendMessage}
            size="icon"
            className="h-12 w-12 rounded-full bg-sky-500 text-white hover:bg-sky-600"
          >
            <Send className="h-5 w-5" />
          </Button>
          <Button
            onClick={toggleRecording}
            size="icon"
            className={cn(
              "h-12 w-12 rounded-full border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200",
              isRecording && "border-sky-200 bg-sky-50 text-sky-600"
            )}
          >
            <Mic className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentChat;
