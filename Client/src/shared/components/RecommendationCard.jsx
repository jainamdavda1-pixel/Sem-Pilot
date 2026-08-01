import React from "react";
import { Sparkles, ArrowRight, Lightbulb } from "lucide-react";
import { Card, CardContent } from "./Card";
import { Button } from "./Button";
import { cn } from "../utils/utils";

export function RecommendationCard({ className, title = "Smart Recommendation", description, actionText = "Apply Roadmap", onAction }) {
  return (
    <Card className={cn(
      "border-blue-100 bg-gradient-to-br from-white to-blue-50/10 shadow-[0_1px_3px_rgba(59,130,246,0.03)] hover:border-blue-200 transition-colors duration-150 relative overflow-hidden",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Circular Icon Container */}
          <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-primary shrink-0">
            <Sparkles className="w-4.5 h-4.5" />
          </div>

          {/* Description and Title */}
          <div className="flex-1 space-y-1">
            <h4 className="text-sm font-semibold text-slate-800 tracking-tight leading-snug">
              {title}
            </h4>
            <p className="text-sm text-slate-600 font-normal leading-relaxed">
              {description}
            </p>

            {/* CTA action */}
            <div className="pt-2">
              <Button variant="link" className="text-xs font-semibold flex items-center gap-1.5 h-auto text-primary hover:text-primary/80" onClick={onAction}>
                <span>{actionText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
