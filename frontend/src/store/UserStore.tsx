import { create } from "zustand";

interface UserData {
  avatar_url: string;
  full_name: string;
  id: string;
  primary_email: string;
  gmail_accounts: {
    id: string;
    type: "primary" | "secondary";
    gmail_address: string;
    avatar_url: string;
    is_sync_active: boolean;
    last_sync_time: any;
  }[];
}

interface UIState {
  selectedEmailAccountIds: string[];
  selectedAccountId: string | null;
  isComposeOpen: boolean;
  showUnread: boolean;
  userData: UserData | undefined;
  setUserData: (userData: UserData) => void;
  setShowUnread: (val: boolean) => void;
  setSelectedEmailAccountIds: (emailId: string[]) => void;
  selectAccount: (accountId: string | null) => void;
  openCompose: () => void;
  closeCompose: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedEmailAccountIds: [],
  selectedLabel: "All",
  selectedAccountId: null,
  isComposeOpen: false,
  userData: undefined,
  showUnread: false,
  setShowUnread: (val) => set({ showUnread: val }),
  setUserData: (userData) => set({ userData }),
  setSelectedEmailAccountIds: (emailIds) =>
    set({ selectedEmailAccountIds: emailIds }),
  selectAccount: (accountId) => set({ selectedAccountId: accountId }),
  openCompose: () => set({ isComposeOpen: true }),
  closeCompose: () => set({ isComposeOpen: false }),
}));
