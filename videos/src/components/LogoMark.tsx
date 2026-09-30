import { brand } from "@repo/design-system/tokens";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const bars = [
  {
    d: "M7.95408 30.4978L5.09742 15.1465H0.228027L3.05855 30.4978H7.95408Z",
    fill: brand.blue,
  },
  {
    d: "M13.6259 40.1151L17.2406 9.78516H12.1696L8.55859 40.1151H13.6259Z",
    fill: brand.red,
  },
  {
    d: "M17.502 30.4973L26.3781 0.133789H31.6209L22.741 30.4973H17.502Z",
    fill: brand.yellow,
  },
];

type LogoMarkProps = {
  height: number;
  delay?: number;
};

export function LogoMark({ height, delay = 0 }: LogoMarkProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <svg viewBox="0 0 32 41" height={height} fill="none">
      {bars.map((bar, index) => {
        const progress = spring({
          frame: frame - delay - index * 4,
          fps,
          config: { damping: 200 },
        });
        return (
          <path
            key={bar.fill}
            d={bar.d}
            fill={bar.fill}
            opacity={progress}
            transform={`translate(0 ${interpolate(progress, [0, 1], [6, 0])})`}
          />
        );
      })}
    </svg>
  );
}
