import React, { useState } from "react";
import { FileText, Image as ImageIcon, Maximize2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BASE_URL } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type Source = {
  source: string;
  page: number;
  type: "text" | "image";
  score: number;
  image_path?: string;
  image_name?: string;
};

interface SourceCardProps {
  source: Source;
  index: number;
}

export function SourceCard({ source, index }: SourceCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isImage = source.type === "image";
  const percentage = (source.score * 100).toFixed(1);
  
  // Construct the image URL: image_path might be "extracted_images/p1_i0.png"
  const imageUrl = source.image_path ? `${BASE_URL}/${source.image_path}` : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Card
          className={cn(
            "p-4 border-l-4 transition-all hover:bg-muted/50 cursor-pointer overflow-hidden relative group",
            isImage ? "border-l-varag-amber" : "border-l-varag-teal",
            isOpen && isImage ? "ring-2 ring-varag-amber ring-offset-2 ring-offset-background" : ""
          )}
          onClick={() => isImage && setIsOpen(true)}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className={cn(
                "p-1.5 rounded-md",
                isImage ? "bg-varag-amber/10 text-varag-amber" : "bg-varag-teal/10 text-varag-teal"
              )}>
                {isImage ? <ImageIcon size={16} /> : <FileText size={16} />}
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                {isImage ? "Visual Context" : "Text Chunk"}
              </span>
            </div>
            {isImage && (
              <Badge variant="secondary" className="text-[10px] bg-varag-amber/20 text-varag-amber border-none font-bold">
                ANALYSIS
              </Badge>
            )}
          </div>

          <div className="space-y-1 mt-3">
            <h5 className="text-sm font-medium text-foreground truncate max-w-[180px]" title={source.source}>
              {source.source}
            </h5>
            <p className="text-xs text-muted-foreground flex items-center space-x-1">
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-muted-foreground/30">
                 p.{source.page}
              </Badge>
            </p>
          </div>

          {/* Image Thumbnail Preview */}
          {isImage && imageUrl && (
            <div className="mt-3 relative aspect-video rounded-lg overflow-hidden bg-muted group-hover:ring-1 ring-varag-amber/30 transition-all">
              <img 
                src={imageUrl} 
                alt={source.image_name || "Context"} 
                className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 size={20} className="text-white scale-75 group-hover:scale-100 transition-transform duration-300" />
              </div>
            </div>
          )}

          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-tight font-semibold">
              <span>Retrieval Score</span>
              <span>{percentage}%</span>
            </div>
            <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 + 0.3 }}
                className={cn(
                  "h-full rounded-full",
                  isImage ? "bg-varag-amber shadow-[0_0_8px_rgba(245,158,11,0.4)]" : "bg-varag-teal shadow-[0_0_8px_rgba(20,184,166,0.4)]"
                )}
              />
            </div>
          </div>
        </Card>

        {/* High-fidelity Image Modal */}
        {isImage && (
          <DialogContent className="sm:max-w-[70vw] h-[80vh] bg-[#0a0a0a] border-border text-foreground overflow-hidden flex flex-col p-1 gap-0">
            <DialogHeader className="p-4 bg-muted/30 border-b border-border flex-row items-center justify-between space-y-0">
               <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-varag-amber/10 text-varag-amber">
                        <ImageIcon size={20} />
                    </div>
                    <div>
                        <DialogTitle className="text-lg font-bold">{source.image_name || "Visual Context"}</DialogTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Source: <span className="text-foreground">{source.source}</span> · Page {source.page}
                        </p>
                    </div>
               </div>
            </DialogHeader>
            <div className="flex-1 overflow-auto bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] flex items-center justify-center p-4">
               {imageUrl ? (
                   <div className="relative rounded-xl overflow-hidden shadow-2xl border border-white/5 bg-background">
                       <img 
                            src={imageUrl} 
                            alt={source.image_name} 
                            className="max-w-full max-h-[60vh] object-contain shadow-[0_0_100px_rgba(0,0,0,0.5)]"
                       />
                   </div>
               ) : (
                   <p className="text-muted-foreground italic">Image preview unavailable.</p>
               )}
            </div>
            <div className="p-4 bg-muted/10 border-t border-border flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Similarity</span>
                        <span className="text-sm font-bold text-varag-amber">{percentage}%</span>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Type</span>
                        <span className="text-sm font-bold">Image / Diagram</span>
                    </div>
                 </div>
                 <a 
                    href={imageUrl || "#"} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest bg-secondary px-3 py-1.5 rounded-lg border border-border"
                 >
                    Original <ExternalLink size={12} />
                 </a>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </motion.div>
  );
}
