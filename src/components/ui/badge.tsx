import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center overflow-hidden border border-transparent px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#141414] text-white [a]:hover:bg-[#F27D26] [a]:hover:text-[#141414]",
        secondary:
          "border-transparent bg-[#F27D26] text-[#141414] [a]:hover:bg-[#141414] [a]:hover:text-white",
        destructive:
          "border-transparent bg-[#E63946] text-white [a]:hover:bg-[#E63946]/80",
        outline:
          "border-[#141414] text-[#141414] shadow-[1px_1px_0px_#141414] [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-[#E4E3E0] hover:text-[#141414]",
        link: "text-[#141414] underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
