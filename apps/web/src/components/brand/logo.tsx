import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "default" | "white";
  className?: string;
};

export function Logo({ variant = "default", className }: LogoProps) {
  const src =
    variant === "white"
      ? "/brand/sdworx-logo-white.svg"
      : "/brand/sdworx-logo.svg";

  return (
    <Image
      src={src}
      alt="SD Worx"
      width={128}
      height={41}
      priority
      className={cn("h-8 w-auto", className)}
    />
  );
}
