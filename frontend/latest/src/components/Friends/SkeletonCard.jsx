const SkeletonCard = ({ variant = 'discovery' }) => {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-[var(--c-input)] flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3 w-1/3 bg-[var(--c-input)] rounded" />
        <div className="h-2.5 w-1/2 bg-[var(--c-input)] rounded" />
        {variant === 'request' && <div className="h-2.5 w-2/3 bg-[var(--c-input)] rounded" />}
      </div>
      {variant === 'discovery' ? (
        <div className="h-8 w-16 bg-[var(--c-input)] rounded-lg flex-shrink-0" />
      ) : (
        <div className="flex gap-1.5 flex-shrink-0">
          <div className="h-8 w-8 bg-[var(--c-input)] rounded-lg" />
          <div className="h-8 w-8 bg-[var(--c-input)] rounded-lg" />
        </div>
      )}
    </div>
  );
};

export default SkeletonCard;
