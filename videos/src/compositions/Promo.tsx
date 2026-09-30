import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { FadeUp } from "../components/FadeUp";
import { LogoMark } from "../components/LogoMark";
import { seconds } from "../video";

const TRANSITION = seconds(0.5);
const SCENES = [seconds(4), seconds(4), seconds(3)] as const;

export const PROMO_DURATION =
  SCENES.reduce((total, scene) => total + scene, 0) -
  TRANSITION * (SCENES.length - 1);

function Intro() {
  return (
    <AbsoluteFill className="items-start justify-center gap-10 bg-blue-950 px-40">
      <LogoMark height={140} delay={6} />
      <FadeUp delay={20}>
        <h1 className="text-[120px] leading-none text-white">Project name</h1>
      </FadeUp>
      <FadeUp delay={30}>
        <p className="text-[44px] text-blue-300">
          One line that says what it does and for whom
        </p>
      </FadeUp>
    </AbsoluteFill>
  );
}

function Statement() {
  return (
    <AbsoluteFill className="bg-background justify-center gap-8 px-40">
      <FadeUp>
        <p className="text-primary text-[28px] font-medium uppercase tracking-[0.08em]">
          The problem
        </p>
      </FadeUp>
      <FadeUp delay={8}>
        <h1 className="max-w-[1400px] text-[96px] leading-[1.05]">
          Replace with the problem statement
        </h1>
      </FadeUp>
    </AbsoluteFill>
  );
}

function Outro() {
  return (
    <AbsoluteFill className="bg-background items-center justify-center">
      <FadeUp>
        <Img src={staticFile("brand/sdworx-logo.svg")} className="h-40" />
      </FadeUp>
    </AbsoluteFill>
  );
}

export function Promo() {
  const transition = (
    <TransitionSeries.Transition
      presentation={fade()}
      timing={linearTiming({ durationInFrames: TRANSITION })}
    />
  );

  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={SCENES[0]}>
        <Intro />
      </TransitionSeries.Sequence>
      {transition}
      <TransitionSeries.Sequence durationInFrames={SCENES[1]}>
        <Statement />
      </TransitionSeries.Sequence>
      {transition}
      <TransitionSeries.Sequence durationInFrames={SCENES[2]}>
        <Outro />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}
