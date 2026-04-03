"use client";

import React, { useRef, useState } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn, formatBytes, truncateFilename } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DocCard } from "./DocCard";
import { checkHealth, ingestPDF, IngestResponse } from "@/lib/api";

type IngestedDoc = {
  name: string;
  pages: number;
  text_chunks: number;
  images: number;
  ingestedAt: Date;
};

interface UploadPanelProps {
  onDocumentAdded: (doc: IngestedDoc) => void;
  ingestedDocs: IngestedDoc[];
  onHealthStatus: (online: boolean) => void;
  isBackendOnline: boolean;
}

export function UploadPanel({ 
  onDocumentAdded, 
  ingestedDocs,
  onHealthStatus,
  isBackendOnline
}: UploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      toast.error("Please select a PDF file.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf") {
        setSelectedFile(file);
      } else {
        toast.error("Please select a PDF file.");
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsIngesting(true);
    try {
      const result: IngestResponse = await ingestPDF(selectedFile);
      const newDoc: IngestedDoc = {
        name: result.source,
        pages: result.pages,
        text_chunks: result.text_chunks,
        images: result.images,
        ingestedAt: new Date(),
      };
      onDocumentAdded(newDoc);
      setSelectedFile(null);
      toast.success(`${result.source} successfully ingested.`);
    } catch (error: any) {
      toast.error(error.message || "Failed to ingest PDF");
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <aside className="w-[280px] h-full flex flex-col bg-background border-r border-border overflow-hidden">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tighter text-varag-purple flex items-center gap-2">
          VARAG
        </h1>
        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em] mt-1 opacity-70">
          Multimodal RAG
        </p>
      </div>

      <div className="px-5 pb-5">
        <div 
          className={cn(
            "relative border-2 border-dashed rounded-xl p-4 transition-all flex flex-col items-center justify-center text-center group cursor-pointer",
            isDragging ? "border-varag-purple bg-varag-purple/5" : "border-border hover:border-muted-foreground hover:bg-muted/30",
            selectedFile ? "border-varag-purple bg-varag-purple/5" : ""
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            accept=".pdf" 
          />
          
          {!selectedFile ? (
            <>
              <div className="p-2 rounded-full bg-secondary mb-2 group-hover:scale-110 group-hover:bg-varag-purple group-hover:text-white transition-all duration-300">
                <Upload size={18} />
              </div>
              <p className="text-xs font-semibold text-foreground">Click to browse or drag PDF</p>
              <p className="text-[10px] text-muted-foreground mt-1 tracking-tight">Maximum size 50MB</p>
            </>
          ) : (
            <div className="w-full flex flex-col items-center">
              <div className="p-2 rounded-full bg-varag-purple text-white mb-2">
                <FileText size={18} />
              </div>
              <p className="text-xs font-semibold text-foreground truncate w-full px-2" title={selectedFile.name}>
                {truncateFilename(selectedFile.name, 22)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{formatBytes(selectedFile.size)}</p>
              
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpload();
                }}
                disabled={isIngesting}
                size="sm"
                className="mt-4 w-full h-8 bg-varag-purple hover:bg-varag-purple/90 text-[10px] uppercase font-bold tracking-wider"
              >
                {isIngesting ? (
                  <>
                    <Loader2 size={12} className="mr-2 animate-spin" />
                    Ingesting...
                  </>
                ) : (
                  "Upload & Ingest"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center px-6 py-2">
        <Separator className="flex-1" />
        <span className="px-3 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50 whitespace-nowrap">
          Ingested Docs
        </span>
        <Separator className="flex-1" />
      </div>

      <ScrollArea className="flex-1 px-5 py-3">
        {ingestedDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-xs text-muted-foreground/60 leading-relaxed max-w-[160px]">
              No documents yet. <br />Upload a PDF to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {ingestedDocs.map((doc, idx) => (
              <DocCard key={idx} {...doc} />
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 bg-muted/30 border-t border-border mt-auto">
        <div className="flex items-center space-x-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isBackendOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.4)]"
          )} />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {isBackendOnline ? "Backend connected" : "Backend offline"}
          </span>
        </div>
      </div>
    </aside>
  );
}
