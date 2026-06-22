export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="w-10 h-10 border-3 border-vendy-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
