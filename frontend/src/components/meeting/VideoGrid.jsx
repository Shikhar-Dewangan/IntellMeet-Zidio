import VideoTile from "./VideoTile.jsx";

export default function VideoGrid({ tiles = [] }) {
  const count = tiles.length;

  // ✅ No useMemo — trivial calculation, memo overhead jyada
  let gridClass = "grid-cols-1";
  if (count === 2) gridClass = "grid-cols-1 sm:grid-cols-2";
  else if (count <= 4) gridClass = "grid-cols-1 sm:grid-cols-2";
  else if (count <= 6) gridClass = "grid-cols-2 lg:grid-cols-3";
  else if (count <= 9) gridClass = "grid-cols-2 lg:grid-cols-3";
  else if (count <= 12) gridClass = "grid-cols-2 lg:grid-cols-4";
  else gridClass = "grid-cols-3 lg:grid-cols-4";

  if (count === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-line bg-surface">
        <div className="px-6 text-center">
          <p className="text-sm font-medium text-fg">Waiting for participants</p>
          <p className="mt-1 text-xs text-fg-3">Share the meeting link to invite others</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid h-full w-full gap-2 sm:gap-3 ${gridClass}`}>
      {tiles.map((tile) => (
        <VideoTile key={tile.userId} stream={tile.stream} participant={tile.participant} className="min-h-40 w-full" />
      ))}
    </div>
  );
}