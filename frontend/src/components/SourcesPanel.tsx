"use client";

import React from "react";
import { ListFilter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SourceCard, Source } from "./SourceCard";
import { motion, AnimatePresence } from "framer-motion";

interface SourcesPanelProps {
  sources: Source[];
  activeMessageId: string | null;
}

export function SourcesPanel({ sources, activeMessageId }: SourcesPanelProps) {
  return (
    <aside className="w-[320px] h-full flex flex-col bg-background border-l border-border transition-all">
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-2">
            Sources
          </h2>
          <Badge 
            variant="outline" 
            className="rounded-full px-2 py-0.5 text-[10px] font-bold border-muted-foreground/30 bg-muted/20"
          >
            {sources.length} Total
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground/60 italic">
          {activeMessageId ? "Retrieved visual and textual context" : "Context will appear here"}
        </p>
      </div>

      <ScrollArea className="flex-1 px-4 py-4 min-h-0">
        <AnimatePresence mode="popLayout">
          {sources.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-[60vh] text-center px-4"
            >
              <div className="p-4 rounded-3xl bg-secondary/30 mb-4">
                <Search size={32} className="text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground/80 leading-relaxed">
                Ask a question to see retrieved sources here.
              </p>
              <p className="text-[10px] text-muted-foreground/40 mt-2 max-w-[180px]">
                VARAG will find the most relevant text chunks and images from your documents.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4 pb-8">
              {sources.map((source, idx) => (
                <SourceCard 
                  key={`${activeMessageId}-${idx}`} 
                  source={source} 
                  index={idx} 
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>
      
      <div className="p-4 border-t border-border bg-muted/10">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">
          <ListFilter size={12} />
          Sorted by relevance score
        </div>
      </div>
    </aside>
  );
}
