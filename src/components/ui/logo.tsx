import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "default" | "small" | "large";
}

export const Logo = ({ className, variant = "default" }: LogoProps) => {
  const sizes = {
    small: "h-8",
    default: "h-10",
    large: "h-12 md:h-14"
  };

  return (
    <div
      className={cn(
        "select-none",
        className
      )}
    >
      <img
        src="/LOGO-720-7.png"
        alt="لوگوی بوته"
        className={cn("block w-auto object-contain", sizes[variant])}
        draggable={false}
      />
    </div>
  );
};
