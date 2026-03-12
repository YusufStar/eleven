export default function ChatLoading() {
  return (
    <div className="flex flex-1 flex-col p-4">
      <div className="h-7 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-4 w-48 animate-pulse rounded bg-muted" />
    </div>
  );
}
