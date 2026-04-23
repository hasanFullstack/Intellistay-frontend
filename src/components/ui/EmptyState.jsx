const EmptyState = ({
  title = "Nothing here yet",
  description,
  action,
  icon,
  className = "py-16",
}) => {
  return (
    <div className={`text-center bg-white rounded-xl border border-gray-100 ${className}`}>
      {icon ? <div className="mx-auto mb-4 text-gray-400 w-fit">{icon}</div> : null}
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      {description ? (
        <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      ) : null}
      {action || null}
    </div>
  );
};

export default EmptyState;
