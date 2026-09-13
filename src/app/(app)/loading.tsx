export default function Loading() {
  return (
    <div className="p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-56 bg-muted rounded" />
        <div className="h-4 w-96 bg-muted rounded" />
        <div className="h-64 bg-muted/70 rounded" />
      </div>
    </div>
  );
}
