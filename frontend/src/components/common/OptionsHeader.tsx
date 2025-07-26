import { getCurrentUser } from "@/api/userApi";
import Avatars from "@/components/common/AccountSelection";
import TestComp from "@/components/common/TestComp";
import { useUIStore } from "@/store/UserStore";
import { useQuery } from "@tanstack/react-query";
import { Pen, Search, ToggleLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";

function OptionsHeader() {
  const isMobileView = useIsMobile();
  const { selectedEmailAccountIds, setSelectedEmailAccountIds } = useUIStore(
    useShallow((store) => ({
      selectedEmailAccountIds: store.selectedEmailAccountIds,
      setSelectedEmailAccountIds: store.setSelectedEmailAccountIds,
    }))
  );
  const { data: userEmailsData, isLoading } = useQuery({
    queryKey: ["userData"],
    queryFn: getCurrentUser,
    select: (user) => user.gmail_accounts,
  });

  return (
    <div className="flex w-full items-center justify-between gap-4">
      <Avatars />
      <div className="flex items-center justify-center gap-4">
        <UnreadToggle />
        <div className="flex gap-4 opacity-30">
          <Search />
          <Pen />
        </div>
      </div>
    </div>
  );
}

export default OptionsHeader;

import { Switch } from "@/components/ui/switch";
export function SwitchDemo() {
  return (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" className="" />
    </div>
  );
}

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

export function UnreadToggle() {
  const setShowUnread = useUIStore(useShallow((store) => store.setShowUnread));
  const [state, setState] = useState(false);
  useEffect(() => {
    setShowUnread(state);
  }, [setShowUnread, state]);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center space-x-2">
          <Switch
            id="airplane-mode"
            checked={state}
            onCheckedChange={setState}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Toggle unread messages</p>
      </TooltipContent>
    </Tooltip>
  );
}
