"use client";

export function FilmGrain() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100]"
      style={{ opacity: 0.04 }}
    >
      <svg className="hidden">
        <filter id="film-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      <div
        className="h-full w-full"
        style={{
          filter: "url(#film-grain)",
          transform: "scale(1.5)",
        }}
      />
    </div>
  );
}
