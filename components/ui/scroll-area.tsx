"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type DivProps = React.HTMLAttributes<HTMLDivElement>

const ScrollArea = React.forwardRef<HTMLDivElement, DivProps>(
  ({ className, children, style, onWheel, onTouchMove, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Smooth, natural scrolling with trackpad/touch
          "relative overflow-y-auto overflow-x-hidden",
          className
        )}
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          touchAction: "pan-y",
          scrollbarGutter: "stable",
          ...style,
        }}
        onWheel={(e) => {
          // keep the scroll inside this area, don't let Dialog/Page swallow it
          e.stopPropagation()
          onWheel?.(e)
        }}
        onTouchMove={(e) => {
          e.stopPropagation()
          onTouchMove?.(e)
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ScrollArea.displayName = "ScrollArea"

export { ScrollArea }
