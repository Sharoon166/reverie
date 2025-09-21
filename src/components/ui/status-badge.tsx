import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  variant?: "lead" | "client" | "invoice";
  className?: string;
}

const getStatusColor = (status: string, variant: string = "lead") => {
  const statusLower = status.toLowerCase();
  
  if (variant === "lead") {
    switch (statusLower) {
      case "new": return "bg-blue-100 text-blue-800 border-blue-200";
      case "contacted": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "qualified": return "bg-green-100 text-green-800 border-green-200";
      case "lost": return "bg-red-100 text-red-800 border-red-200";
      case "converted": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }
  
  if (variant === "client") {
    switch (statusLower) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "inactive": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }
  
  if (variant === "invoice") {
    switch (statusLower) {
      case "paid": return "bg-green-100 text-green-800 border-green-200";
      case "overdue": return "bg-red-100 text-red-800 border-red-200";
      case "draft": return "bg-gray-100 text-gray-800 border-gray-200";
      case "sent": return "bg-blue-100 text-blue-800 border-blue-200";
      case "cancelled": return "bg-slate-100 text-slate-800 border-slate-200";
      case "partially paid": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }
  
  return "bg-gray-100 text-gray-800 border-gray-200";
};

export function StatusBadge({ status, variant = "lead", className }: StatusBadgeProps) {
  const colorClass = getStatusColor(status, variant);
  
  return (
    <Badge 
      variant="outline" 
      className={cn(colorClass, "font-medium", className)}
    >
      {status}
    </Badge>
  );
}