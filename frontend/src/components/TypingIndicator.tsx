import React from "react";

export function TypingIndicator() {
  return (
    <div className="flex space-x-1.5 p-3 rounded-lg bg-secondary/50 w-fit">
      <div
        className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
        style={{ animationDelay: "0.2s" }}
      />
      <div
        className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
        style={{ animationDelay: "0.4s" }}
      />
    </div>
  );
}
