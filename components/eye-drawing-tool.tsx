"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Side = "right" | "left"

interface EyeDrawingToolProps {
  rightEye?: string
  leftEye?: string
  onChangeAction: (side: Side, dataUrl: string) => void
  defaultBothUrl?: string
}

export function EyeDrawingTool({ rightEye, leftEye, onChangeAction, defaultBothUrl }: EyeDrawingToolProps) {
  const [active, setActive] = React.useState<Side>("right")
  const [color, setColor] = React.useState<string>("#000000")
  const [size, setSize] = React.useState<number>(2)

  const rightRef = React.useRef<HTMLCanvasElement | null>(null)
  const leftRef = React.useRef<HTMLCanvasElement | null>(null)

  const historyRef = React.useRef<{ [K in Side]: ImageData[] }>({ right: [], left: [] })
  const redoRef = React.useRef<{ [K in Side]: ImageData[] }>({ right: [], left: [] })
  const drawingRef = React.useRef<boolean>(false)
  const lastPosRef = React.useRef<{ x: number; y: number } | null>(null)
  const initializedRef = React.useRef<boolean>(false)
  const backgroundImageRef = React.useRef<{ [K in Side]: ImageData | null }>({ right: null, left: null })

  // Match the actual image dimensions for each eye: 425x350 (half of 850x350)
  const CANVAS_W = 425
  const CANVAS_H = 350

  // Shared function to draw dot grid pattern
  const drawDotGridPattern = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, width, height)

    // Draw subtle dot grid pattern
    ctx.fillStyle = "#e5e7eb" // gray-200
    const spacing = 20
    const dotSize = 1

    for (let x = spacing; x < width; x += spacing) {
      for (let y = spacing; y < height; y += spacing) {
        ctx.beginPath()
        ctx.arc(x, y, dotSize, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  React.useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    // Initialize canvases with the actual eye image
    const init = (side: Side) => {
      const canvas = side === "right" ? rightRef.current : leftRef.current
      if (!canvas) return
      canvas.width = CANVAS_W
      canvas.height = CANVAS_H
      const ctx = canvas.getContext("2d")!
      
      // Draw dot grid pattern as background
      drawDotGridPattern(ctx, CANVAS_W, CANVAS_H)
      
      if ((side === "right" && rightEye) || (side === "left" && leftEye)) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          // Redraw grid pattern first, then the image
          drawDotGridPattern(ctx, CANVAS_W, CANVAS_H)
          ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H)
          // take snapshot as first history state
          historyRef.current[side] = [ctx.getImageData(0, 0, CANVAS_W, CANVAS_H)]
          redoRef.current[side] = []
        }
        img.onerror = (e) => {
          console.error(`Failed to load ${side} eye image:`, side === "right" ? rightEye : leftEye, e)
          // Set history and redo to sensible defaults when image fails to load
          // Clear canvas to maintain UI consistency
          ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
          drawDotGridPattern(ctx, CANVAS_W, CANVAS_H)
          // Take snapshot of the cleared canvas as the first history state
          historyRef.current[side] = [ctx.getImageData(0, 0, CANVAS_W, CANVAS_H)]
          redoRef.current[side] = []
        }
        img.src = side === "right" ? rightEye! : leftEye!
      } else {
        // take snapshot as first history state
        historyRef.current[side] = [ctx.getImageData(0, 0, CANVAS_W, CANVAS_H)]
        redoRef.current[side] = []
      }
    }
    init("right")
    init("left")
    // If a combined default image is provided, slice it into right/left and draw
    if (defaultBothUrl) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const half = Math.floor(img.width / 2)

        const sliceDraw = (side: Side) => {
          const canvas = side === "right" ? rightRef.current : leftRef.current
          if (!canvas) return
          const ctx = canvas.getContext("2d")!
          // Draw dot grid pattern first
          drawDotGridPattern(ctx, CANVAS_W, CANVAS_H)
          const sx = side === "right" ? 0 : half
          const sy = 0
          const sWidth = half
          const sHeight = img.height
          // Draw the actual image from the PNG
          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, CANVAS_W, CANVAS_H)
          // Store the background image permanently
          backgroundImageRef.current[side] = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H)
          historyRef.current[side] = [ctx.getImageData(0, 0, CANVAS_W, CANVAS_H)]
          redoRef.current[side] = []
          onChangeAction(side, canvas.toDataURL("image/png"))
        }
        sliceDraw("right")
        sliceDraw("left")
      }
      img.onerror = (e) => {
        console.error("Failed to load eye image:", defaultBothUrl, e)
      }
      img.src = defaultBothUrl
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getCtx = (side: Side) => {
    const canvas = side === "right" ? rightRef.current : leftRef.current
    return canvas?.getContext("2d") || null
  }

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, side: Side) => {
    // Prevent default for touch events to stop scrolling
    if ('touches' in e) {
      e.preventDefault();
    }

    drawingRef.current = true
    redoRef.current[side] = [] // new stroke invalidates redo
    const pos = getPos(e, side)
    lastPosRef.current = pos
    // snapshot history
    const ctx = getCtx(side)!
    historyRef.current[side].push(ctx.getImageData(0, 0, CANVAS_W, CANVAS_H))
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, side: Side) => {
    // Prevent default for touch events to stop scrolling
    if ('touches' in e) {
      e.preventDefault();
    }

    if (!drawingRef.current) return
    const ctx = getCtx(side)
    const last = lastPosRef.current
    const pos = getPos(e, side)
    if (!ctx || !last || !pos) return
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = color
    ctx.lineWidth = size

    ctx.beginPath()
    ctx.moveTo(last.x, last.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()

    lastPosRef.current = pos
  }

  const endDraw = (side: Side) => {
    if (!drawingRef.current) return
    drawingRef.current = false
    lastPosRef.current = null
    const canvas = side === "right" ? rightRef.current : leftRef.current
    if (!canvas) return
    onChangeAction(side, canvas.toDataURL("image/png"))
  }

  const clearSide = (side: Side) => {
    const ctx = getCtx(side)
    if (!ctx) return
    
    // Reload the original eye image when clearing
    if (defaultBothUrl) {
      const img = new Image()
      img.onload = () => {
        const half = Math.floor(img.width / 2)
        const sx = side === "right" ? 0 : half
        // Draw dot grid pattern first
        drawDotGridPattern(ctx, CANVAS_W, CANVAS_H)
        ctx.drawImage(img, sx, 0, half, img.height, 0, 0, CANVAS_W, CANVAS_H)
        historyRef.current[side].push(ctx.getImageData(0, 0, CANVAS_W, CANVAS_H))
        redoRef.current[side] = []
        const canvas = side === "right" ? rightRef.current : leftRef.current
        if (canvas) onChangeAction(side, canvas.toDataURL("image/png"))
      }
      img.src = defaultBothUrl
    } else {
      // Just draw dot grid pattern
      drawDotGridPattern(ctx, CANVAS_W, CANVAS_H)
      historyRef.current[side].push(ctx.getImageData(0, 0, CANVAS_W, CANVAS_H))
      redoRef.current[side] = []
      const canvas = side === "right" ? rightRef.current : leftRef.current
      if (canvas) onChangeAction(side, canvas.toDataURL("image/png"))
    }
  }

  const undo = (side: Side) => {
    const ctx = getCtx(side)
    if (!ctx) return
    const hist = historyRef.current[side]
    if (hist.length <= 1) return
    const current = hist.pop()!
    redoRef.current[side].push(current)
    const prev = hist[hist.length - 1]
    ctx.putImageData(prev, 0, 0)
    const canvas = side === "right" ? rightRef.current : leftRef.current
    if (canvas) onChangeAction(side, canvas.toDataURL("image/png"))
  }

  const redo = (side: Side) => {
    const ctx = getCtx(side)
    if (!ctx) return
    const redoStack = redoRef.current[side]
    if (redoStack.length === 0) return
    const data = redoStack.pop()!
    historyRef.current[side].push(data)
    ctx.putImageData(data, 0, 0)
    const canvas = side === "right" ? rightRef.current : leftRef.current
    if (canvas) onChangeAction(side, canvas.toDataURL("image/png"))
  }

  const download = (mode: Side | "both") => {
    if (mode === "both") {
      const combo = document.createElement("canvas")
      combo.width = CANVAS_W * 2 + 16
      combo.height = CANVAS_H
      const ctx = combo.getContext("2d")!
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, combo.width, combo.height)
      if (rightRef.current) ctx.drawImage(rightRef.current, 0, 0)
      if (leftRef.current) ctx.drawImage(leftRef.current, CANVAS_W + 16, 0)
      const link = document.createElement("a")
      link.download = `eyes-${Date.now()}.png`
      link.href = combo.toDataURL("image/png")
      link.click()
    } else {
      const canvas = mode === "right" ? rightRef.current : leftRef.current
      if (!canvas) return
      const link = document.createElement("a")
      link.download = `${mode}-eye-${Date.now()}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    }
  }

  function getPos(e: any, side: Side): { x: number; y: number } {
    const canvas = (side === "right" ? rightRef.current : leftRef.current)!
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = e.touches ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    
    // Scale coordinates from CSS size to canvas internal size
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    return { 
      x: (clientX - rect.left) * scaleX, 
      y: (clientY - rect.top) * scaleY 
    }
  }

  function drawEyeGuide(ctx: CanvasRenderingContext2D) {
    // No longer needed - using actual image instead of drawn guide
  }

  const CanvasBox = React.memo<{ side: Side; title: string; refEl: React.RefObject<HTMLCanvasElement> }>(function CanvasBox({ side, title, refEl }) {

    return (
      <div 
        className={cn(
          "border-2 border-gray-200 border-t-0 rounded-b-lg overflow-hidden",
          active === side ? "ring-2 ring-gray-400" : ""
        )}
        onClick={() => setActive(side)}
      >
        <div className="bg-gray-100 text-xs font-bold text-gray-600 uppercase py-1 text-center rounded-t-lg border-t-2 border-gray-200">
          {title}
        </div>
        <div className="bg-white p-2">
          <canvas
            key={`canvas-${side}`}
            ref={refEl}
            className="w-full h-auto rounded select-none touch-none"
            style={{ maxHeight: '350px', aspectRatio: '425/350', objectFit: 'contain' }}
            onMouseDown={(e) => startDraw(e, side)}
            onMouseMove={(e) => draw(e, side)}
            onMouseUp={() => endDraw(side)}
            onMouseLeave={() => endDraw(side)}
            onTouchStart={(e) => startDraw(e, side)}
            onTouchMove={(e) => draw(e, side)}
            onTouchEnd={() => endDraw(side)}
            onWheel={(e) => { e.preventDefault() }}
          />
        </div>
      </div>
    )
  })

  // Sync when external images change (e.g., file upload)
  React.useEffect(() => {

    const apply = (side: Side, dataUrl?: string) => {
      if (!dataUrl) return
      const canvas = side === "right" ? rightRef.current : leftRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")!
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        // Redraw grid pattern first, then the image
        drawDotGridPattern(ctx, CANVAS_W, CANVAS_H)
        ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H)
        // reset history baseline after external load
        historyRef.current[side] = [ctx.getImageData(0, 0, CANVAS_W, CANVAS_H)]
        redoRef.current[side] = []
      }
      img.src = dataUrl
    }
    apply("right", rightEye)
    apply("left", leftEye)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rightEye, leftEye])

  return (
    <div className="space-y-4">
      {/* Floating Toolbar Dock */}
      <div className="bg-white shadow-lg border border-gray-200 rounded-full px-6 py-2 flex items-center gap-4 mx-auto w-max mb-4">
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => undo(active)}
          className={cn("h-8")}
        >
          ⟲ Undo
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => redo(active)}
          className={cn("h-8")}
        >
          ⟲⟲ Redo
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => clearSide(active)}
          className={cn("h-8")}
        >
          🧹 Clear
        </Button>
        <div className="flex items-center gap-2 px-2">
          <span className="text-xs text-gray-600 w-8 text-right">{size}px</span>
          <input
            type="range"
            min={1}
            max={12}
            step={1}
            value={size}
            onChange={(e) => setSize(Number(e.target.value) || 1)}
            className="w-24"
            aria-label={`Brush size ${size}px`}
          />
        </div>
        <div className={cn(
          "relative",
          "ring-2 ring-gray-400 rounded-full"
        )}>
          <input
            type="color"
            aria-label="Brush color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-8 rounded-full border-2 border-gray-300 cursor-pointer"
            style={{ 
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none',
            }}
          />
        </div>
      </div>

      {/* Comparison Frame */}
      <div className="grid grid-cols-2 gap-4">
        <CanvasBox side="right" title="RIGHT EYE (OD)" refEl={rightRef} />
        <CanvasBox side="left" title="LEFT EYE (OS)" refEl={leftRef} />
      </div>
    </div>
  )
}
