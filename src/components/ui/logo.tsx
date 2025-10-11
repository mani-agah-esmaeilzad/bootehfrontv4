import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "default" | "small" | "large";
}

export const Logo = ({ className, variant = "default" }: LogoProps) => {
  const sizes = {
    small: "text-xl",
    default: "text-2xl",
    large: "text-3xl md:text-4xl"
  };

  return (
    <div className={cn(
      "font-bold select-none -mb-1.5",
      sizes[variant],
      className
    )}>
      <span className="bg-hrbooteh-gradient-primary bg-clip-text text-transparent">
        HR
      </span>
      <span className="text-yellow-400">
        booteh
      </span>
    </div>
  );
};