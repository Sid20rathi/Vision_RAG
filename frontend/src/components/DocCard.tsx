import React from "react";
import { FileText } from "lucide-react";
import { formatRelativeTime, truncateFilename } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface DocCardProps {
  name: string;
  pages: number;
  text_chunks: number;
  images: number;
  ingestedAt: Date;
}

export function DocCard({
  name,
  pages,
  text_chunks,
  images,
  ingestedAt,
}: DocCardProps) {
  return (
    <Card className="p-3 bg-secondary/30 border-border hover:bg-secondary/50 transition-colors cursor-default group">
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-lg bg-varag-purple/10 text-varag-purple shrink-0 group-hover:scale-105 transition-transform">
          <FileText size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground truncate" title={name}>
            {truncateFilename(name, 28)}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {pages} pages · {text_chunks} chunks · {images} images
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            Ingested {formatRelativeTime(ingestedAt)}
          </p>
        </div>
      </div>
    </Card>
  );
}
