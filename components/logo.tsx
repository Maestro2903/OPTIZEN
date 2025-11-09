import Image from "next/image"

interface LogoProps {
  className?: string
  width?: number
  height?: number
}

export function Logo({ className = "size-4", width = 16, height = 16 }: LogoProps) {
  return (
    <Image 
      src="/logo.svg" 
      alt="EyeZen Logo" 
      width={width}
      height={height}
      className={className}
    />
  )
}

