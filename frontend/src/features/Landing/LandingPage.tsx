import { handleLogin } from "@/api/userApi";
import { useLocation, useNavigate } from "react-router";

function LandingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  console.log(location.state?.from?.pathname);
  const temp = import.meta.env.VITE_API_BASE_URL;
  console.log(temp);
  return (
    <div className="flex gap-10">
      <button onClick={handleLogin}>{temp}</button>
      <button onClick={() => navigate("test")}>Click me to test</button>
      <button onClick={() => navigate("inbox")}>Inbox</button>
    </div>
  );
}

export default LandingPage;
