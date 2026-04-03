"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Moon, Sun, Monitor, AlertTriangle } from "lucide-react";
import { UploadPanel } from "@/components/UploadPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { SourcesPanel } from "@/components/SourcesPanel";
import { Message } from "@/components/MessageBubble";
import { Source, checkHealth, queryVARAG } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type IngestedDoc = {
  name: string;
  pages: number;
  text_chunks: number;
  images: number;
  ingestedAt: Date;
};

export default function VARAGHome() {
  // UI State
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  
  // Data State
  const [ingestedDocs, setIngestedDocs] = useState<IngestedDoc[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);
  
  // Active context state
  const [activeSources, setActiveSources] = useState<Source[]>([]);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  // Health check on mount and interval
  useEffect(() => {
    const healthCheck = async () => {
      const online = await checkHealth();
      setIsBackendOnline(online);
    };

    healthCheck();
    const interval = setInterval(healthCheck, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  // Update light/dark mode on the HTML element
  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [isDarkMode]);

  const handleDocumentAdded = useCallback((doc: IngestedDoc) => {
    setIngestedDocs(prev => [doc, ...prev]);
  }, []);

  const handleSendMessage = useCallback(async (question: string) => {
    if (!isBackendOnline) {
      toast.error("Backend is offline. Please check your connection.");
      return;
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsQuerying(true);

    try {
      const response = await queryVARAG(question);
      
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.answer,
        sources: response.sources,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
      setActiveSources(response.sources);
      setActiveMessageId(assistantMsg.id);
    } catch (error: any) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `**Error:** ${error.message || "Something went wrong while querying VARAG."}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
      toast.error("Query failed");
    } finally {
      setIsQuerying(false);
    }
  }, [isBackendOnline]);

  const handleViewSources = useCallback((sources: Source[]) => {
    setActiveSources(sources);
    // Find message ID if needed to highlight
    const msg = messages.find(m => m.sources === sources);
    if (msg) setActiveMessageId(msg.id);
  }, [messages]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div className={cn(
      "flex h-screen w-full overflow-hidden bg-background text-foreground",
      "selection:bg-varag-purple/20 selection:text-varag-purple"
    )}>
      {/* Dark mode toggle - Absolute position at top right */}
      <div className="fixed top-3 right-8 z-[100]">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full w-9 h-9 border border-border bg-background/50 backdrop-blur-md hover:bg-muted"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
      </div>

      {!isBackendOnline && (
          <div className="fixed top-0 left-0 right-0 h-1 bg-red-500 z-[200] opacity-50" />
      )}

      {/* Main Layout */}
      <div className="flex w-full h-full">
        {/* Left Panel */}
        <UploadPanel 
          onDocumentAdded={handleDocumentAdded}
          ingestedDocs={ingestedDocs}
          onHealthStatus={setIsBackendOnline}
          isBackendOnline={isBackendOnline}
        />

        {/* Center Panel */}
        <ChatPanel 
          messages={messages}
          onSendMessage={handleSendMessage}
          onReceiveResponse={(answer, sources) => {}} // Legacy from plan, handled in handleSendMessage
          onViewSources={handleViewSources}
          isQuerying={isQuerying}
          hasDocs={ingestedDocs.length > 0}
        />

        {/* Right Panel */}
        <SourcesPanel 
          sources={activeSources} 
          activeMessageId={activeMessageId}
        />
      </div>
    </div>
  );
}
