import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "default" | "small" | "large";
}

export const Logo = ({ className, variant = "default" }: LogoProps) => {
  const sizes = {
    small: "text-xl",
    default: "text-2xl",
    large: "text-4xl"
  };

  return (
    <div className={cn(
      "font-bold bg-hrbooteh-gradient-primary bg-clip-text text-transparent select-none",
      sizes[variant],
      className
    )}>
      hrbooteh
    </div>
  );
};