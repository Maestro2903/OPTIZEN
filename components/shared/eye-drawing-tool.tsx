"use client"

import React, { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type EyeId = "right" | "left"
type Side = EyeId

type Point = {
  x: number
  y: number
}

type Stroke = {
  points: Point[]
  color: string
  size: number
}

type EyeState = {
  strokes: Stroke[]
  undoneStrokes: Stroke[]
}

const initialEyeState: EyeState = { strokes: [], undoneStrokes: [] }

interface EyeDrawingToolProps {
  rightEye?: string
  leftEye?: string
  onChangeAction: (side: Side, dataUrl: string) => void
  defaultBothUrl?: string
}

export function EyeDrawingTool({ rightEye, leftEye, onChangeAction, defaultBothUrl }: EyeDrawingToolProps) {
  const [activeEye, setActiveEye] = useState<EyeId>("right")
  const [brushColor, setBrushColor] = useState("#000000")
  const [brushSize, setBrushSize] = useState(2)
  const [eyes, setEyes] = useState<Record<EyeId, EyeState>>({
    right: { ...initialEyeState },
    left: { ...initialEyeState },
  })

  // Canvas refs
  const rightCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Drawing state per eye (not in React state – so we don't re-render on every move)
  const isDrawingRef = useRef<Record<EyeId, boolean>>({ right: false, left: false })
  const currentStrokeRef = useRef<Record<EyeId, Stroke | null>>({
    right: null,
    left: null,
  })

  // Template image refs to track if loaded
  const templateImageRef = useRef<Record<EyeId, HTMLImageElement | null>>({
    right: null,
    left: null,
  })

  // Fixed canvas dimensions matching the template images
  const CANVAS_W = 425
  const CANVAS_H = 350

  // Utility: get canvas + context for eye
  const getCanvasAndCtx = (eye: EyeId) => {
    const canvas = eye === "right" ? rightCanvasRef.current : leftCanvasRef.current
    if (!canvas) return { canvas: null, ctx: null as CanvasRenderingContext2D | null }

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    return { canvas, ctx }
  }

  // Load template image
  const loadTemplateImage = (eye: EyeId): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (templateImageRef.current[eye]) {
        resolve(templateImageRef.current[eye]!)
        return
      }

      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        templateImageRef.current[eye] = img
        resolve(img)
      }
      img.onerror = () => {
        reject(new Error(`Failed to load ${eye} eye template`))
      }
      img.src = eye === "right" ? "/right-eye.png" : "/left-eye.png"
    })
  }

  // Draw template image and grid on canvas
  const drawBackground = async (eye: EyeId, ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    // Draw dot grid pattern
    ctx.fillStyle = "#e5e7eb"
    const spacing = 20
    const dotSize = 1

    for (let x = spacing; x < CANVAS_W; x += spacing) {
      for (let y = spacing; y < CANVAS_H; y += spacing) {
        ctx.beginPath()
        ctx.arc(x, y, dotSize, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Draw template image
    try {
      const templateImg = await loadTemplateImage(eye)
      ctx.drawImage(templateImg, 0, 0, CANVAS_W, CANVAS_H)
    } catch (error) {
      console.warn(`Template image not available for ${eye} eye:`, error)
    }
  }

  // Track if we have existing diagrams loaded (so we don't redraw strokes unnecessarily)
  const hasExistingDiagramRef = useRef<Record<EyeId, boolean>>({ right: false, left: false })

  // Setup canvases on mount
  useEffect(() => {
    const setupCanvas = async (eye: EyeId) => {
      const { canvas, ctx } = getCanvasAndCtx(eye)
      if (!canvas || !ctx) return

      canvas.width = CANVAS_W
      canvas.height = CANVAS_H
      
      // Set canvas styles
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      
      // Load existing diagram if provided
      const existingDiagram = eye === "right" ? rightEye : leftEye
      if (existingDiagram) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          // Draw existing diagram directly (it already includes template + any previous drawings)
          ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
          ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H)
          hasExistingDiagramRef.current[eye] = true
        }
        img.onerror = () => {
          console.warn(`Failed to load existing diagram for ${eye} eye`)
          // Fall back to background
          hasExistingDiagramRef.current[eye] = false
          drawBackground(eye, ctx)
        }
        img.src = existingDiagram
      } else {
        // No existing diagram, draw background with template
        hasExistingDiagramRef.current[eye] = false
        await drawBackground(eye, ctx)
      }
    }

    setupCanvas("right")
    setupCanvas("left")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Redraw a whole eye from stored strokes
  const redrawEye = async (eye: EyeId, strokesToDraw?: Stroke[]): Promise<void> => {
    const { canvas, ctx } = getCanvasAndCtx(eye)
    if (!canvas || !ctx) return

    // Use provided strokes or get from current state
    const strokes = strokesToDraw ?? eyes[eye].strokes

    return new Promise((resolve) => {
      const existingDiagram = eye === "right" ? rightEye : leftEye
      
      // If we have an existing diagram (from props), we need to reload it first
      if (hasExistingDiagramRef.current[eye] && existingDiagram) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          // Clear canvas and draw existing diagram
          ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
          ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H)
          
          // Now draw current strokes on top
          strokes.forEach((stroke) => {
            if (!stroke.points.length) return

            ctx.beginPath()
            ctx.strokeStyle = stroke.color
            ctx.lineWidth = stroke.size
            ctx.lineCap = "round"
            ctx.lineJoin = "round"

            const [first, ...rest] = stroke.points
            ctx.moveTo(first.x, first.y)
            rest.forEach((p) => ctx.lineTo(p.x, p.y))

            ctx.stroke()
          })
          
          resolve()
        }
        img.onerror = () => {
          // Fallback: draw background and strokes
          drawBackground(eye, ctx).then(() => {
            strokes.forEach((stroke) => {
              if (!stroke.points.length) return

              ctx.beginPath()
              ctx.strokeStyle = stroke.color
              ctx.lineWidth = stroke.size
              ctx.lineCap = "round"
              ctx.lineJoin = "round"

              const [first, ...rest] = stroke.points
              ctx.moveTo(first.x, first.y)
              rest.forEach((p) => ctx.lineTo(p.x, p.y))

              ctx.stroke()
            })
            resolve()
          })
        }
        img.src = existingDiagram
      } else {
        // No existing diagram, just draw background and strokes
        drawBackground(eye, ctx).then(() => {
          strokes.forEach((stroke) => {
            if (!stroke.points.length) return

            ctx.beginPath()
            ctx.strokeStyle = stroke.color
            ctx.lineWidth = stroke.size
            ctx.lineCap = "round"
            ctx.lineJoin = "round"

            const [first, ...rest] = stroke.points
            ctx.moveTo(first.x, first.y)
            rest.forEach((p) => ctx.lineTo(p.x, p.y))

            ctx.stroke()
          })
          resolve()
        })
      }
    })
  }

  // Notify parent when diagram changes
  const notifyChange = (eye: EyeId) => {
    const { canvas } = getCanvasAndCtx(eye)
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png")
      onChangeAction(eye, dataUrl)
    }
  }

  // Redraw both eyes when strokes change
  useEffect(() => {
    redrawEye("right").then(() => {
      notifyChange("right")
    })
    redrawEye("left").then(() => {
      notifyChange("left")
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eyes])

  // Load existing diagrams when props change (for edit mode)
  useEffect(() => {
    const loadDiagram = async (eye: EyeId, dataUrl?: string) => {
      const { canvas, ctx } = getCanvasAndCtx(eye)
      if (!canvas || !ctx) return

      if (!dataUrl) {
        // No existing diagram, clear strokes and draw background
        hasExistingDiagramRef.current[eye] = false
        setEyes((prev) => ({
          ...prev,
          [eye]: { strokes: [], undoneStrokes: [] },
        }))
        await drawBackground(eye, ctx)
        return
      }

      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        // If loading an existing diagram, display it directly
        // Keep existing strokes - user might want to add more
        hasExistingDiagramRef.current[eye] = true
        
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
        ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H)
        
        // Draw any new strokes on top if there are any
        const eyeState = eyes[eye]
        if (eyeState.strokes.length > 0) {
          eyeState.strokes.forEach((stroke) => {
            if (!stroke.points.length) return

            ctx.beginPath()
            ctx.strokeStyle = stroke.color
            ctx.lineWidth = stroke.size
            ctx.lineCap = "round"
            ctx.lineJoin = "round"

            const [first, ...rest] = stroke.points
            ctx.moveTo(first.x, first.y)
            rest.forEach((p) => ctx.lineTo(p.x, p.y))

            ctx.stroke()
          })
        }
      }
      img.onerror = () => {
        console.warn(`Failed to load diagram for ${eye} eye`)
        hasExistingDiagramRef.current[eye] = false
        // Fall back to background
        drawBackground(eye, ctx)
      }
      img.src = dataUrl
    }

    loadDiagram("right", rightEye)
    loadDiagram("left", leftEye)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rightEye, leftEye])

  // Start drawing
  const handlePointerDown = (eye: EyeId) => (e: React.PointerEvent<HTMLCanvasElement>) => {
    setActiveEye(eye)

    const { canvas, ctx } = getCanvasAndCtx(eye)
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    isDrawingRef.current[eye] = true
    currentStrokeRef.current[eye] = {
      points: [{ x, y }],
      color: brushColor,
      size: brushSize,
    }

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  // Draw while moving
  const handlePointerMove = (eye: EyeId) => (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current[eye]) return

    const { canvas, ctx } = getCanvasAndCtx(eye)
    if (!canvas || !ctx) return

    const stroke = currentStrokeRef.current[eye]
    if (!stroke) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    stroke.points.push({ x, y })

    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.size
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    const lastIndex = stroke.points.length - 1
    const prevPoint = stroke.points[lastIndex - 1]

    if (!prevPoint) return

    ctx.beginPath()
    ctx.moveTo(prevPoint.x, prevPoint.y)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  // Finish stroke
  const endDrawing = (eye: EyeId) => {
    if (!isDrawingRef.current[eye]) return

    isDrawingRef.current[eye] = false
    const stroke = currentStrokeRef.current[eye]

    if (!stroke || stroke.points.length < 2) {
      currentStrokeRef.current[eye] = null
      return
    }

    // Stroke is already drawn on canvas, save to state and notify immediately
    setEyes((prev) => {
      const updatedEye: EyeState = {
        strokes: [...prev[eye].strokes, stroke],
        undoneStrokes: [], // clear redo stack after new stroke
      }

      // Notify immediately since stroke is already visible on canvas
      setTimeout(() => {
        notifyChange(eye)
      }, 0)

      return { ...prev, [eye]: updatedEye }
    })

    currentStrokeRef.current[eye] = null
  }

  const handlePointerUp = (eye: EyeId) => () => endDrawing(eye)
  const handlePointerLeave = (eye: EyeId) => () => endDrawing(eye)

  // Undo for active eye
  const handleUndo = () => {
    setEyes((prev) => {
      const eyeState = prev[activeEye]
      if (!eyeState.strokes.length) return prev

      const strokes = [...eyeState.strokes]
      const stroke = strokes.pop()!

      const undoneStrokes = [...eyeState.undoneStrokes, stroke]

      const updated: Record<EyeId, EyeState> = {
        ...prev,
        [activeEye]: { strokes, undoneStrokes },
      }

      // Immediately redraw with the updated strokes
      redrawEye(activeEye, strokes).then(() => {
        notifyChange(activeEye)
      })

      return updated
    })
  }

  // Redo for active eye
  const handleRedo = () => {
    setEyes((prev) => {
      const eyeState = prev[activeEye]
      if (!eyeState.undoneStrokes.length) return prev

      const undoneStrokes = [...eyeState.undoneStrokes]
      const stroke = undoneStrokes.pop()!

      const strokes = [...eyeState.strokes, stroke]

      const updated: Record<EyeId, EyeState> = {
        ...prev,
        [activeEye]: { strokes, undoneStrokes },
      }

      // Immediately redraw with the updated strokes
      redrawEye(activeEye, strokes).then(() => {
        notifyChange(activeEye)
      })

      return updated
    })
  }

  // Clear active eye
  const handleClear = async () => {
    const { ctx } = getCanvasAndCtx(activeEye)
    if (!ctx) return

    // Mark that we no longer have an existing diagram after clearing
    hasExistingDiagramRef.current[activeEye] = false

    setEyes((prev) => {
      const updated: Record<EyeId, EyeState> = {
        ...prev,
        [activeEye]: { strokes: [], undoneStrokes: [] },
      }

      return updated
    })

    // Redraw background (clear the canvas)
    await drawBackground(activeEye, ctx)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white shadow-lg border border-gray-200 rounded-full px-6 py-2 flex items-center gap-4 mx-auto w-max mb-4">
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={handleUndo}
          className={cn("h-8")}
        >
          ⟲ Undo
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={handleRedo}
          className={cn("h-8")}
        >
          ⟲⟲ Redo
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={handleClear}
          className={cn("h-8")}
        >
          🧹 Clear
        </Button>
        <div className="flex items-center gap-2 px-2">
          <span className="text-xs text-gray-600 w-8 text-right">{brushSize}px</span>
          <input
            type="range"
            min={1}
            max={12}
            step={1}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value) || 1)}
            className="w-24"
            aria-label={`Brush size ${brushSize}px`}
          />
        </div>
        <div className={cn("relative", "ring-2 ring-gray-400 rounded-full")}>
          <input
            type="color"
            aria-label="Brush color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="h-8 w-8 rounded-full border-2 border-gray-300 cursor-pointer"
            style={{ 
              WebkitAppearance: "none",
              MozAppearance: "none",
              appearance: "none",
            }}
          />
        </div>
      </div>

      {/* Canvases */}
      <div className="grid grid-cols-2 gap-4">
        {/* RIGHT EYE */}
        <div
          className={cn(
            "border-2 rounded-lg p-2 cursor-pointer transition-colors",
            activeEye === "right"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 bg-gray-50"
          )}
          onClick={() => setActiveEye("right")}
        >
          <div className="text-xs font-bold text-gray-600 uppercase mb-2 text-center">
            RIGHT EYE (OD)
          </div>
          <canvas
            ref={rightCanvasRef}
            className="w-full rounded select-none touch-none"
            style={{
              height: "350px",
              cursor: "crosshair",
              backgroundImage:
                "radial-gradient(#e5e7eb 0.5px, transparent 0.5px), radial-gradient(#e5e7eb 0.5px, transparent 0.5px)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 8px 8px",
              aspectRatio: "425/350",
            }}
            onPointerDown={handlePointerDown("right")}
            onPointerMove={handlePointerMove("right")}
            onPointerUp={handlePointerUp("right")}
            onPointerLeave={handlePointerLeave("right")}
          />
        </div>

        {/* LEFT EYE */}
        <div
          className={cn(
            "border-2 rounded-lg p-2 cursor-pointer transition-colors",
            activeEye === "left"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 bg-gray-50"
          )}
          onClick={() => setActiveEye("left")}
        >
          <div className="text-xs font-bold text-gray-600 uppercase mb-2 text-center">
            LEFT EYE (OS)
          </div>
          <canvas
            ref={leftCanvasRef}
            className="w-full rounded select-none touch-none"
            style={{
              height: "350px",
              cursor: "crosshair",
              backgroundImage:
                "radial-gradient(#e5e7eb 0.5px, transparent 0.5px), radial-gradient(#e5e7eb 0.5px, transparent 0.5px)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 8px 8px",
              aspectRatio: "425/350",
            }}
            onPointerDown={handlePointerDown("left")}
            onPointerMove={handlePointerMove("left")}
            onPointerUp={handlePointerUp("left")}
            onPointerLeave={handlePointerLeave("left")}
          />
        </div>
      </div>
    </div>
  )
}
