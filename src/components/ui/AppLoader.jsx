const AppLoader = ({
  message = "Loading...",
  className = "py-16",
  sizeClass = "h-10 w-10",
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        <div
          className={`animate-spin rounded-full ${sizeClass} border-2 border-[#2b5a84] border-t-transparent mx-auto mb-3`}
        ></div>
        <p className="text-gray-500 text-sm">{message}</p>
      </div>
    </div>
  );
};

export default AppLoader;
