import "./ErrorMessage.css";

const ErrorMessage = ({ message = "Something went wrong", onRetry }) => {
  return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <p className="error-text">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary retry-btn">
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
