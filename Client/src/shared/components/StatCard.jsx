import React from "react";
import { Card, CardContent } from "./Card";
import { Badge } from "./Badge";
import { cn } from "../utils/utils";

export function StatCard({ className, title, value, description, icon: Icon, trend }) {
  return (
    <Card className={cn("overflow-hidden hover:border-slate-300 transition-colors duration-150", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
            {title}
          </span>
          {Icon && (
            <div className="w-8 h-8 rounded bg-slate-50 border border-slate-200/50 flex items-center justify-center text-slate-400">
              <Icon className="w-4 h-4 text-slate-500" />
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-2.5">
          <span className="text-3xl font-semibold tracking-tight text-slate-900 leading-none">
            {value}
          </span>
          {trend && (
            <Badge variant={trend.type}>
              {trend.text}
            </Badge>
          )}
        </div>

        {description && (
          <p className="mt-2 text-xs font-normal text-slate-500">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
