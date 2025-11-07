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
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
      
      if ((side === "right" && rightEye) || (side === "left" && leftEye)) {
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H)
        }
        img.src = side === "right" ? rightEye! : leftEye!
      }
      // take snapshot as first history state
      historyRef.current[side] = [ctx.getImageData(0, 0, CANVAS_W, CANVAS_H)]
      redoRef.current[side] = []
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
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
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
    drawingRef.current = true
    redoRef.current[side] = [] // new stroke invalidates redo
    const pos = getPos(e, side)
    lastPosRef.current = pos
    // snapshot history
    const ctx = getCtx(side)!
    historyRef.current[side].push(ctx.getImageData(0, 0, CANVAS_W, CANVAS_H))
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, side: Side) => {
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
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    
    // Reload the original eye image when clearing
    if (defaultBothUrl) {
      const img = new Image()
      img.onload = () => {
        const half = Math.floor(img.width / 2)
        const sx = side === "right" ? 0 : half
        ctx.drawImage(img, sx, 0, half, img.height, 0, 0, CANVAS_W, CANVAS_H)
        historyRef.current[side].push(ctx.getImageData(0, 0, CANVAS_W, CANVAS_H))
        redoRef.current[side] = []
        const canvas = side === "right" ? rightRef.current : leftRef.current
        if (canvas) onChangeAction(side, canvas.toDataURL("image/png"))
      }
      img.src = defaultBothUrl
    } else {
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

  const CanvasBox = React.memo<{ side: Side; title: string; refEl: React.RefObject<HTMLCanvasElement> }>(({ side, title, refEl }) => (
    <div className={cn(
      "p-2 rounded border",
      active === side ? "ring-1 ring-foreground/20 border-foreground/20" : "border-muted"
    )}
         onClick={() => setActive(side)}>
      <div className="text-center text-sm mb-1 font-medium">{title}</div>
      <canvas
        key={`canvas-${side}`}
        ref={refEl}
        className="w-full h-auto bg-white rounded border select-none touch-none"
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
  ))

  // Sync when external images change (e.g., file upload)
  React.useEffect(() => {
    const apply = (side: Side, dataUrl?: string) => {
      if (!dataUrl) return
      const canvas = side === "right" ? rightRef.current : leftRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")!
      // clear and redraw
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
      const img = new Image()
      img.onload = () => {
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
    <div className="rounded-xl border bg-card">
      <div className="p-3 border-b flex flex-wrap items-center gap-3 text-sm justify-between">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => undo(active)}>⟲ Undo</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => redo(active)}>⟲⟲ Redo</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => clearSide(active)}>🧹 Clear</Button>
          <div className="ml-2 flex items-center gap-2">
            <span className="text-muted-foreground w-10 text-right">{size}px</span>
            <input
              type="range"
              min={1}
              max={12}
              step={1}
              value={size}
              onChange={(e) => setSize(Number(e.target.value) || 1)}
              className="w-[140px]"
            />
          </div>
          <input
            type="color"
            aria-label="Brush color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-8 rounded border p-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Active: {active === 'right' ? 'Right Eye' : 'Left Eye'}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => download(active)}>⬇︎ {active === 'right' ? 'Right' : 'Left'}</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => download("both")}>⬇︎ Both</Button>
        </div>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <CanvasBox side="right" title="Right Eye" refEl={rightRef} />
        <CanvasBox side="left" title="Left Eye" refEl={leftRef} />
      </div>
      <div className="px-4 pb-4">
        <div className="text-xs text-muted-foreground rounded-md bg-muted/50 p-2">
          Tip: Click an eye canvas to make it active. Use the toolbar to draw, undo/redo, clear, or download. Adjust brush color and size.
        </div>
      </div>
    </div>
  )
}
