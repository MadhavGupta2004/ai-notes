import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="vh-100 d-flex flex-column justify-content-center align-items-center text-center">
      <h1 style={{ fontSize: "6rem" }}>404</h1>
      <h4 className="mb-3">Page Not Found</h4>
      <p className="text-muted mb-4">
        The page you are looking for doesn’t exist.
      </p>

      <button
        className="btn btn-primary"
        onClick={() => navigate("/")}
      >
        Go Home
      </button>
    </div>
  );
}
