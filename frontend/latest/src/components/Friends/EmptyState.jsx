const EmptyState = ({ icon: Icon, title, subtitle }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 bg-[var(--c-input)] rounded-2xl flex items-center justify-center mb-4">
        <Icon className="text-2xl text-[var(--c-text-muted)]" />
      </div>
      <p className="text-sm font-medium text-[var(--c-text)]">{title}</p>
      {subtitle && (
        <p className="text-xs text-[var(--c-text-muted)] mt-1 max-w-xs">{subtitle}</p>
      )}
    </div>
  );
};

export default EmptyState;
