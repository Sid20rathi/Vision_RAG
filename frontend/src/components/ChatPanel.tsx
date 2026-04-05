"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Zap, MessageSquare, Sparkles, AlertCircle, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble, Message } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { Source, queryVARAG } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (question: string) => void;
  onReceiveResponse: (answer: string, sources: Source[]) => void;
  onViewSources: (sources: Source[]) => void;
  isQuerying: boolean;
  hasDocs: boolean;
}

const EXAMPLE_QUESTIONS = [
  "What are the key findings in this document?",
  "Summarize the architecture diagrams",
  "What metrics or statistics are mentioned?",
];

export function ChatPanel({
  messages,
  onSendMessage,
  onReceiveResponse,
  onViewSources,
  isQuerying,
  hasDocs,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isQuerying]);

  const handleSend = () => {
    if (!input.trim() || isQuerying) return;
    const question = input.trim();
    onSendMessage(question);
    setInput("");
    
    // Call API logic is handled in the parent, but we initiate it
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main className="flex-1 min-w-0 h-full flex flex-col bg-background relative overflow-hidden">
      <div className="h-16 border-b border-border flex items-center px-8 bg-background/50 backdrop-blur-md z-10 sticky top-0">
        <h2 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
          <MessageSquare size={16} className="text-varag-purple" />
          Ask anything
        </h2>
      </div>

      <ScrollArea className="flex-1 px-8 py-6 min-h-0" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-2">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="relative"
              >
                <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-varag-purple/20 to-varag-purple/5 border border-varag-purple/20 backdrop-blur-sm">
                  <Zap size={48} className="text-varag-purple fill-varag-purple/10" />
                </div>
                <div className="absolute -top-1 -right-1">
                    <Sparkles size={20} className="text-varag-purple animate-pulse" />
                </div>
              </motion.div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-bold tracking-tight text-foreground">
                  Hello! How can I help you?
                </h3>
                <p className="text-sm text-muted-foreground max-w-[400px] leading-relaxed mx-auto">
                    VARAG is your multimodal assistant that can extract insights from text and images in your PDFs.
                </p>
              </div>

              {!hasDocs && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-varag-amber/10 border border-varag-amber/20 text-varag-amber text-xs font-semibold animate-bounce mt-4">
                      <AlertCircle size={14} />
                      Upload a PDF to start asking questions
                  </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-2xl py-4">
                {EXAMPLE_QUESTIONS.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(question)}
                    className="p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 hover:border-varag-purple/30 text-xs font-medium text-muted-foreground hover:text-foreground transition-all text-left flex flex-col justify-between group"
                  >
                    <span>{question}</span>
                    <span className="mt-2 text-varag-purple/0 group-hover:text-varag-purple transition-all flex items-center">
                        Ask now <Send size={10} className="ml-1" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="pb-12">
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                  <MessageBubble 
                    key={msg.id} 
                    message={msg} 
                    onViewSources={onViewSources} 
                  />
                ))}
                {isQuerying && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex w-full mb-8 items-start gap-4"
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <Bot size={16} className="text-primary" />
                    </div>
                    <TypingIndicator />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-8 pb-10 pt-0 bg-gradient-to-t from-background via-background to-transparent z-10">
        <div className="max-w-3xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-varag-purple/20 to-varag-purple/5 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
          <div className="relative border border-border bg-background/80 backdrop-blur-xl rounded-2xl p-1.5 focus-within:border-varag-purple/50 shadow-xl transition-all">
            <Textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hasDocs ? "Type your question..." : "Waiting for document ingestion..."}
              disabled={!hasDocs || isQuerying}
              className="resize-none border-none focus-visible:ring-0 text-sm py-3 px-4 min-h-[44px] max-h-[160px] bg-transparent"
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="text-[10px] text-muted-foreground/60 px-2 font-medium tracking-wide uppercase">
                {input.length > 0 ? "Shift + Enter for new line" : ""}
              </div>
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isQuerying || !hasDocs}
                className={cn(
                  "h-9 w-9 rounded-xl transition-all duration-300",
                  input.trim() && !isQuerying && hasDocs 
                    ? "bg-varag-purple hover:bg-varag-purple/90 text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isQuerying ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </Button>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-center text-muted-foreground/40 mt-3 font-medium uppercase tracking-widest">
            Vision-Augmented Retrieval & Generation — Built for Multimodal RAG
        </p>
      </div>
    </main>
  );
}

// Helper for type safety in imports
