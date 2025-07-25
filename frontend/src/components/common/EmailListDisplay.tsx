import {
  getEmailsByLabel,
  getEmailsBySystemLabel,
  getSelectedEmailsByLabel,
} from "@/api/emailsApi";
import Avatar from "@/components/common/Avatar";
import LabelOptions from "@/features/Inbox/components/LabelOptions";
import { useEmailMutations } from "@/hooks/useEmailMutations";
import useSystemView from "@/hooks/useSystemView";
import { wrapString } from "@/lib/strings";
import { cn, formatDateToDayMonth } from "@/lib/utils";
import { useUIStore } from "@/store/UserStore";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Check, Circle, Clock, Loader, LoaderIcon, Star } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { useShallow } from "zustand/react/shallow";

function EmailListDisplay() {
  const { systemView, navigateTo } = useSystemView();
  const { labelId } = useParams();
  const { selectedEmailAccountIds, showUnread } = useUIStore(
    useShallow((store) => ({
      selectedEmailAccountIds: store.selectedEmailAccountIds,
      showUnread: store.showUnread,
    }))
  );

  const queryFn = ({ pageParam = 1 }) => {
    if (labelId) {
      return getSelectedEmailsByLabel(
        labelId,
        selectedEmailAccountIds,
        pageParam,
        10
      );
    }
    if (systemView) {
      return getEmailsBySystemLabel(
        systemView,
        selectedEmailAccountIds,
        pageParam,
        10
      );
    }
    // Return a promise that resolves to an empty structure if no filter is provided
    return Promise.resolve({ emails: [], nextPage: undefined });
  };

  const {
    data,
    error,
    fetchNextPage,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [
      "emails",
      { systemView, labelId, accounts: selectedEmailAccountIds },
    ],
    queryFn: queryFn,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!((systemView || labelId) && selectedEmailAccountIds.length),
    retry: false,
  });

  const observer = useRef<IntersectionObserver>();
  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [hasNextPage, fetchNextPage, isFetchingNextPage]
  );

  if (error) {
    console.error(error);
  }
  if (isLoading) return <Loader />;
  return (
    <>
      <div className="@container flex h-full w-full flex-col gap-2 overflow-y-auto bg-background pt-4 text-lg">
        {data?.pages?.map((page, index) =>
          page.emails
            .filter((val) => (showUnread ? val.is_unread === showUnread : true))
            .map((val, i) => {
              const isLastElement =
                index === data.pages.length - 1 && i === page.emails.length - 1;
              return (
                <div ref={isLastElement ? lastElementRef : null} key={val.id}>
                  <EmailListItem
                    email={val}
                    navigateTo={navigateTo}
                    selectedEmailAccountIds={selectedEmailAccountIds}
                  />
                </div>
              );
            })
        )}
        {isFetchingNextPage && (
          <div className="flex justify-center">
            <LoaderIcon />
          </div>
        )}
      </div>
    </>
  );
}

export default EmailListDisplay;

function EmailListItem({ email, navigateTo, selectedEmailAccountIds }) {
  const { systemView } = useSystemView();
  // console.log(email);
  const { emailId } = useParams();
  const { labelId } = useParams();
  const navigate = useNavigate();
  const listQueryKey = [
    "emails",
    { systemView, labelId, accounts: selectedEmailAccountIds },
  ];
  const { toggleStarred, archiveEmail, isPending } =
    useEmailMutations(listQueryKey);
  return (
    <div
      className={cn(
        `${emailId === email.id ? "border-l-2 border-accent-foreground bg-accent pl-1" : ""} group relative flex overflow-visible py-2 hover:border-l-2 hover:border-accent-foreground hover:bg-accent hover:pl-1`
      )}
      data-id={email.id}
      onClick={() =>
        navigate(`${navigateTo}${labelId ? `/${labelId}` : ""}/${email.id}`)
      }
    >
      <div className="flex w-[90%] flex-col @5xl:flex-row">
        <div className="flex items-center gap-4 @5xl:min-w-[22%]">
          <div className="relative flex flex-col items-center justify-center gap-4 @5xl:flex-row">
            <div
              className={`${selectedEmailAccountIds.length > 1 ? "" : "hidden"} flex items-center`}
            >
              <Avatar
                src={email.gmail_account.avatar_url}
                name={email.gmail_account.gmail_name}
                size="h-5 w-5"
              />
            </div>
            <div
              className={`${selectedEmailAccountIds.length > 1 ? "top-9" : "left-1"} absolute flex items-center @5xl:static`}
            >
              <div
                className={`h-1.5 w-1.5 ${email?.is_unread ? "block" : "opacity-0"} rounded-full bg-blue-600`}
              ></div>
            </div>
          </div>
          <div className="truncate pr-12 text-xl font-semibold whitespace-nowrap @5xl:pr-4">
            {email.from_name}
          </div>
        </div>
        <div className="flex w-[78%] gap-2 text-xl @5xl:pl-2">
          <div
            className={`${selectedEmailAccountIds.length > 1 ? "ml-9" : "ml-4"} truncate font-medium whitespace-nowrap @4xl:overflow-visible @4xl:text-clip @5xl:ml-0`}
          >
            {email?.subject}
          </div>
          <div className="ml-4 hidden truncate pr-8 font-light whitespace-nowrap @5xl:block">
            {wrapString(email?.snippet, 110 - email.subject?.length)}
          </div>
        </div>
      </div>
      <div className="absolute right-0 mr-4 translate-y-1/2 group-hover:mr-5 @5xl:translate-0">
        <div className="group-hover:hidden">
          {formatDateToDayMonth(email.received_date)}
        </div>
        <div
          className="hidden gap-3 group-hover:flex"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="cursor-pointer hover:text-muted-foreground">
            <Check onClick={() => archiveEmail(email)} />
          </div>
          <div className="cursor-pointer hover:text-muted-foreground">
            <Star
              fill={email?.is_starred ? "#F2CC21" : "none"}
              onClick={() => toggleStarred(email)}
              strokeWidth={email?.is_starred ? 0 : 2}
            />
          </div>
          <div className="cursor-pointer hover:text-muted-foreground">
            <Clock />
          </div>
        </div>
      </div>
      <div className="min-w-3/12 text-left text-xl whitespace-nowrap @5xl:min-w-[10%]"></div>
    </div>
  );
}
