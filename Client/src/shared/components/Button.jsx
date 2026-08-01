import React from "react";
import { cn } from "../utils/utils";

export const Button = React.forwardRef(
  ({ className, variant = "primary", size = "md", as: Component = "button", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-md transition-all-calm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none text-sm";
    
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm active:scale-[0.98]",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]",
      outline: "border border-border bg-white text-foreground hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]",
      ghost: "hover:bg-slate-100 hover:text-slate-900",
      link: "text-primary underline-offset-4 hover:underline p-0 bg-transparent",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-9 px-4 py-2 gap-2",
      lg: "h-10 px-6 text-base gap-2.5",
      icon: "h-9 w-9 p-0",
    };

    return (
      <Component
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
