export default function LoadingSpinner({
  size = "md",
  color = "white",
  text = "",
}) {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-[2.5px]",
    lg: "w-10 h-10 border-[3px]",
  };
  const colors = {
    white: "border-white/40 border-t-white",
    blue: "border-blue-200 border-t-blue-600",
    slate: "border-slate-300 border-t-slate-600",
  };
  return (
    <div className="flex items-center justify-center gap-2">
      <div
        className={`${sizes[size]} ${colors[color]} rounded-full animate-spin`}
      />
      {text && <span className="text-sm font-medium">{text}</span>}
    </div>
  );
}
