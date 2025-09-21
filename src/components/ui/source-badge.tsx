import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SourceBadgeProps {
  source: string;
  className?: string;
}

const getSourceColor = (source: string) => {
  const sourceLower = source.toLowerCase();
  
  switch (sourceLower) {
    case "website": return "bg-blue-100 text-blue-800 border-blue-200";
    case "linkedin": return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "referral": return "bg-green-100 text-green-800 border-green-200";
    case "cold email": return "bg-purple-100 text-purple-800 border-purple-200";
    case "facebook": return "bg-cyan-100 text-cyan-800 border-cyan-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export function SourceBadge({ source, className }: SourceBadgeProps) {
  const colorClass = getSourceColor(source);
  
  return (
    <Badge 
      variant="outline" 
      className={cn(colorClass, "font-medium", className)}
    >
      {source}
    </Badge>
  );
}