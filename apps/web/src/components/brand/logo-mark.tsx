import { cn } from "@/lib/utils";

type LogoMarkProps = {
  variant?: "default" | "white";
  className?: string;
};

export function LogoMark({ variant = "default", className }: LogoMarkProps) {
  const white = variant === "white";

  return (
    <svg
      viewBox="0 0 32 41"
      fill="none"
      aria-hidden="true"
      className={cn("h-10 w-auto", className)}
    >
      <path
        d="M17.502 30.4973L26.3781 0.133789H31.6209L22.741 30.4973H17.502Z"
        className={white ? "fill-white" : "fill-brand-yellow"}
      />
      <path
        d="M13.6259 40.1151L17.2406 9.78516H12.1696L8.55859 40.1151H13.6259Z"
        className={white ? "fill-white" : "fill-brand-red"}
      />
      <path
        d="M7.95408 30.4978L5.09742 15.1465H0.228027L3.05855 30.4978H7.95408Z"
        className={white ? "fill-white" : "fill-brand-blue"}
      />
    </svg>
  );
}
