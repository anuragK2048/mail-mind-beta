import { getCurrentUser } from "@/api/userApi";
import { useUIStore } from "@/store/UserStore";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

function ProtectedRoute({ children }) {
  const { setSelectedEmailAccountIds, setUserData } = useUIStore(
    useShallow((store) => ({
      setSelectedEmailAccountIds: store.setSelectedEmailAccountIds,
      setUserData: store.setUserData,
    }))
  );
  const {
    data: userData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userData"],
    queryFn: getCurrentUser,
  });

  useEffect(() => {
    const primary = userData?.gmail_accounts.find(
      (val) => val.type === "primary"
    );
    if (primary) {
      setSelectedEmailAccountIds([primary.id]);
    }
    setUserData(userData);
  }, [userData, setSelectedEmailAccountIds, setUserData]);

  let component = null;
  if (isLoading) component = <Loader />;
  else if (!userData || error) component = <div>Unable to fetch your data</div>;

  return (
    <>
      {component ? (
        <div className="flex items-center justify-center">{component}</div>
      ) : (
        <div className="h-full">{children}</div>
      )}
    </>
  );
}

export default ProtectedRoute;
