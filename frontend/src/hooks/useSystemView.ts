import { useLocation } from "react-router";

function useSystemView() {
  const location = useLocation();
  const pathname = location.pathname;

  if (pathname.startsWith("/inbox"))
    return { systemView: undefined, navigateTo: "/inbox" };
  if (pathname.startsWith("/starred"))
    return { systemView: "STARRED", navigateTo: "/starred" };
  if (pathname.startsWith("/drafts"))
    return { systemView: "DRAFT", navigateTo: "/drafts" };
  if (pathname.startsWith("/sent"))
    return { systemView: "SENT", navigateTo: "/sent" };
  if (pathname.startsWith("/done"))
    return { systemView: "ARCHIVED", navigateTo: "/done" };
  if (pathname.startsWith("/spam"))
    return { systemView: "SPAM", navigateTo: "/spam" };

  return { systemView: undefined, navigateTo: undefined };
}

export default useSystemView;
