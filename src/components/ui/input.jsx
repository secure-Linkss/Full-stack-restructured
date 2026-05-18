import * as React from "react"

import { cn } from "../../lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-white/25 selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-lg border px-3 py-1 text-sm text-white/80 outline-none transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "focus-visible:ring-2",
        "aria-invalid:border-destructive",
        className
      )}
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
      {...props} />
  );
}

export { Input }
