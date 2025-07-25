import { getLabelOptions } from "@/api/labelsApi";
import { SelectDemo } from "@/components/common/Select";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LabelSettingsPopup from "@/features/Inbox/components/LabelSettingsPopup";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";

function LabelOptions() {
  const { emailId } = useParams();
  const { labelId } = useParams();
  const navigate = useNavigate();
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");
  const {
    data: labels,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userLabels"],
    queryFn: getLabelOptions,
  });

  if (isLoading) return <Loader />;
  if (error) return <div>{error.message}</div>;
  const allLabelOptions = [
    { id: "all", name: "All" },
    ...(labels || []),
    { id: "other", name: "Other" },
  ];
  return (
    <div className="@container">
      <div className="hidden w-full items-center gap-14 overflow-x-auto text-3xl @5xl:flex">
        {allLabelOptions?.map((val) => (
          <Link
            to={`/inbox/${val.id}${emailId ? `/${emailId}` : ""}`}
            key={val.id}
            className={`${labelId === val.id ? "text-accent-foreground" : "text-accent-foreground/50"} py-2 whitespace-nowrap hover:text-accent-foreground`}
          >
            {val.name}
          </Link>
        ))}
        <LabelSettingsPopup labels={labels} />
      </div>
      <div className="mt-2 flex px-2 @5xl:hidden">
        <Select
          // The value is ALWAYS the string ID from the URL param
          value={labelId}
          // The onValueChange handler will navigate to the new URL
          onValueChange={(newLabelId) => {
            // This assumes react-router is set up to handle this navigation
            navigate(`/inbox/${newLabelId}${emailId ? `/${emailId}` : ""}`);
            // window.location.href = `/inbox/${newLabelId}${emailId ? `/${emailId}` : ""}`; // Simple redirect
          }}
        >
          <SelectTrigger className="min-h-[50px] w-full text-lg">
            <SelectValue placeholder="Select a category..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Labels</SelectLabel>
              {allLabelOptions.map((label) => (
                <SelectItem
                  key={label.id}
                  value={label.id}
                  className="text-md py-3"
                >
                  {label.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default LabelOptions;
