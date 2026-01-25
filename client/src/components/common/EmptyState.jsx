import "./EmptyState.css";

const EmptyState = ({
  message = "No items found",
  icon = "🔍",
  children,
}) => {
  return (
    <div className="empty-state-container">
      <div className="empty-icon">{icon}</div>
      <p className="empty-message">{message}</p>
      {children && <div className="empty-actions">{children}</div>}
    </div>
  );
};

export default EmptyState;
