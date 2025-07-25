import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import OptionsHeader from "@/components/common/OptionsHeader";
import { Outlet } from "react-router";
import { useEffect } from "react";
import { startWatchingForUpdates } from "@/api/syncApi";

export default function AppLayout() {
  // Start watching for incoming emails
  useEffect(() => {
    startWatchingForUpdates();
  }, []);
  return (
    <SidebarProvider className="flex h-full w-full">
      <AppSidebar />
      <main className="relative flex h-full min-w-0 flex-1 flex-col">
        <SidebarTrigger className="absolute z-50" />
        <div className="relative mb-2 flex h-[70px] shrink-0 items-end px-4 md:px-12 lg:px-20">
          <OptionsHeader />
        </div>
        <div className="relative z-0 flex-1 overflow-hidden px-4 pb-4 md:px-12 lg:px-20">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  );
}

// Mark as Read/Unread
// Done
// Star
// Remind later
