export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-md bg-gray-200 bg-[length:200%_100%] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:bg-gray-800 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 ${className}`}
    />
  );
}
