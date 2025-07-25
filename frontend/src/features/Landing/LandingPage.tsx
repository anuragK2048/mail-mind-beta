import { handleLogin } from "@/api/userApi";
import { useLocation } from "react-router";

function LandingPage() {
  const location = useLocation();
  console.log(location.state?.from?.pathname);
  const temp = import.meta.env.VITE_API_BASE_URL;
  return (
    <div>
      <button onClick={handleLogin}>{temp}</button>
    </div>
  );
}

export default LandingPage;
