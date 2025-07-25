import { handleLogin } from "@/api/userApi";
import { useLocation } from "react-router";

function LandingPage() {
  const location = useLocation();
  console.log(location.state?.from?.pathname);

  return (
    <div>
      <button onClick={handleLogin}>Login/Signup</button>
    </div>
  );
}

export default LandingPage;
