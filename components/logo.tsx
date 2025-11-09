import Image from "next/image"

interface LogoProps {
  className?: string
  width?: number
  height?: number
}

export function Logo({ className, width = 16, height = 16 }: LogoProps) {
  // Only use default size class if custom dimensions aren't provided
  const finalClassName = (width !== 16 || height !== 16) 
    ? className 
    : className || "size-4"
  
  return (
    <Image 
      src="/logo.svg" 
      alt="EyeZen Logo" 
      width={width}
      height={height}
      className={finalClassName}
    />
  )
}

