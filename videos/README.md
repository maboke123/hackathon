# Videos

Promo videos are React components rendered to MP4 with [Remotion](https://www.remotion.dev), styled with the shared design system.

```sh
pnpm videos          # Remotion Studio with live preview
pnpm videos:render   # renders out/promo.mp4
```

- Compositions live in `src/compositions` and are registered in `src/Root.tsx`.
- Videos are 1920x1080 at 30 fps. Use `seconds()` from `src/video.ts` instead of raw frame counts.
- Put voice-over and music in `public/audio` and play them with `<Audio src={staticFile("audio/file.mp3")} />` from `remotion`.
- Put screen recordings of the demo in `public/` and embed them with `<OffthreadVideo />`.
