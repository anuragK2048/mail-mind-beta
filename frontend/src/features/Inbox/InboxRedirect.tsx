import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getLabelOptions } from "@/api/labelsApi";
import { useEffect } from "react";
import { useUIStore } from "@/store/UserStore";
import { useShallow } from "zustand/react/shallow";

function InboxRedirect() {
  const navigate = useNavigate();
  const params = useParams();
  const { data: labels, error: labelError } = useQuery({
    queryKey: ["userLabels"],
    queryFn: getLabelOptions,
  });

  console.log("rerendered");

  useEffect(() => {
    if (labels && !params.labelId) {
      // const defaultLabel = labels.find((val) => val.name === "Education"); // TODO sequence labels in DB
      const defaultLabel = labels?.at(0); // TODO sequence labels in DB
      navigate(`/inbox/${defaultLabel.id}`, { replace: true });
    }
  }, [labels, navigate]);

  return <div className="p-4">Redirecting...</div>;
}

export default InboxRedirect;
