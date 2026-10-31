export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-md bg-gray-200 bg-[length:200%_100%] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 ${className}`}
    />
  );
}
