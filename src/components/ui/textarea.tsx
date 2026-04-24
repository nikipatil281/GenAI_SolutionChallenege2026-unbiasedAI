import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-none border border-[#141414] shadow-[2px_2px_0px_#141414] bg-white px-2.5 py-2 text-sm font-mono transition-colors outline-none placeholder:opacity-50 focus-visible:border-[#F27D26] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
