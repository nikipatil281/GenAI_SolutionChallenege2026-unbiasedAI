import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-none border border-[#141414] shadow-[2px_2px_0px_#141414] bg-white px-2.5 py-1 text-sm font-mono transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-[10px] file:font-bold file:uppercase file:text-[#141414] placeholder:opacity-50 focus-visible:border-[#F27D26] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
