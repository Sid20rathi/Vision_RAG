import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import { Eye, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Source } from "@/lib/api";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  timestamp: Date;
};

interface MessageBubbleProps {
  message: Message;
  onViewSources: (sources: Source[]) => void;
}

export function MessageBubble({ message, onViewSources }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "flex w-full mb-8 items-start gap-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
        isUser ? "bg-varag-purple text-white shadow-lg" : "bg-secondary text-primary"
      )}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div className={cn(
        "flex flex-col gap-2 max-w-[85%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "px-4 py-3 rounded-2xl",
          isUser 
            ? "bg-varag-purple text-white rounded-tr-none shadow-md" 
            : "text-foreground rounded-tl-none border-none"
        )}>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    return (
                        <code className={cn("bg-muted px-1 py-0.5 rounded font-mono", className)} {...props}>
                            {children}
                        </code>
                    )
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewSources(message.sources!)}
            className="text-[10px] h-7 px-2 font-semibold tracking-wide uppercase text-muted-foreground hover:text-foreground hover:bg-secondary/50 group transition-all"
          >
            <Eye size={12} className="mr-1.5 group-hover:scale-110 transition-transform" />
            View Sources ({message.sources.length})
          </Button>
        )}
      </div>
    </motion.div>
  );
}
