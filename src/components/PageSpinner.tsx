export default function PageSpinner() {
  return (
    <div className="mx-auto flex max-w-lg items-center justify-center px-4 py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-card-border border-t-accent" />
    </div>
  );
}
