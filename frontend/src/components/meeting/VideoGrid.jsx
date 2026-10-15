// frontend/src/components/meeting/VideoGrid.jsx
import VideoTile from "./VideoTile.jsx";

export default function VideoGrid({ tiles = [], layoutMode = "grid" }) {
  const count = tiles.length;

  if (count === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-line bg-surface">
        <div className="px-6 text-center">
          <p className="text-sm font-medium text-fg">Waiting for participants</p>
          <p className="mt-1 text-xs text-fg-3">
            Share the meeting link to invite others
          </p>
        </div>
      </div>
    );
  }

  /* ============ SPEAKER VIEW ============ */
  if (layoutMode === "speaker" && count > 1) {
    const [main, ...rest] = tiles;
    return (
      <div className="flex h-full w-full flex-col gap-2 sm:gap-3">
        {/* Main speaker */}
        <div className="flex-1 min-h-0">
          <VideoTile
            stream={main.stream}
            participant={main.participant}
            className="h-full w-full"
          />
        </div>
        {/* Film strip */}
        <div className="flex shrink-0 gap-2 overflow-x-auto pb-1 sm:gap-3">
          {rest.slice(0, 8).map((tile) => (
            <div key={tile.userId} className="w-32 shrink-0 sm:w-40">
              <VideoTile
                stream={tile.stream}
                participant={tile.participant}
                className="aspect-video"
                compact
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ============ GRID VIEW (responsive cols) ============ */
  let gridClass = "grid-cols-1";
  if (count === 1) gridClass = "grid-cols-1";
  else if (count <= 2) gridClass = "grid-cols-1 sm:grid-cols-2";
  else if (count <= 4) gridClass = "grid-cols-2";
  else if (count <= 6) gridClass = "grid-cols-2 sm:grid-cols-3";
  else if (count <= 9) gridClass = "grid-cols-2 sm:grid-cols-3";
  else if (count <= 12) gridClass = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
  else gridClass = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

  return (
    <div className={`grid h-full w-full gap-2 sm:gap-3 ${gridClass}`}>
      {tiles.map((tile) => (
        <VideoTile
          key={tile.userId}
          stream={tile.stream}
          participant={tile.participant}
          className="aspect-video w-full"
        />
      ))}
    </div>
  );
}