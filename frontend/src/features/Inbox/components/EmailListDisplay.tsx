import { getEmailsByLabel, getSelectedEmailsByLabel } from "@/api/emailsApi";
import LabelOptions from "@/features/Inbox/components/LabelOptions";
import { useEmailMutations } from "@/hooks/useEmailMutations";
import { wrapString } from "@/lib/strings";
import { useUIStore } from "@/store/UserStore";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Check, Circle, Clock, Loader, LoaderIcon, Star } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { useShallow } from "zustand/react/shallow";

function EmailListDisplay() {
  const { labelId } = useParams();
  const selectedEmailAccountIds = useUIStore(
    useShallow((store) => store.selectedEmailAccountIds)
  );
  console.log(selectedEmailAccountIds);

  const {
    data,
    error,
    fetchNextPage,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["inbox", `${labelId}`, selectedEmailAccountIds],
    queryFn: ({ pageParam }) =>
      getSelectedEmailsByLabel(labelId, selectedEmailAccountIds, pageParam, 8),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!labelId,
    retry: false,
  });

  const listQueryKey = ["inbox", `${labelId}`, selectedEmailAccountIds];
  const { toggleStarred } = useEmailMutations(listQueryKey);

  console.log(data);

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
      <div className="@container flex h-full w-full flex-col gap-2 overflow-y-auto bg-slate-300 text-lg">
        {data?.pages?.map((page, index) =>
          page.emails.map((val, i) => {
            const isLastElement =
              index === data.pages.length - 1 && i === page.emails.length - 1;
            return (
              <div ref={isLastElement ? lastElementRef : null} key={val.id}>
                <EmailListItem email={val} toggleStarred={toggleStarred} />
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

function EmailListItem({ email, toggleStarred }) {
  // console.log(email);
  const { labelId } = useParams();
  const navigate = useNavigate();
  return (
    <div
      className="group relative flex overflow-visible bg-slate-200 py-2 hover:border-l-2 hover:border-accent-foreground hover:bg-accent hover:pl-1"
      data-id={email.id}
      onClick={() =>
        navigate(`/inbox${labelId ? `/${labelId}` : ""}/${email.id}`)
      }
    >
      <div className="flex w-11/12 flex-col @5xl:flex-row">
        <div className="flex gap-3 @5xl:w-3/12">
          <div>{email.gmail_account.gmail_address.slice(0, 2)}</div>
          <div className="flex items-center">
            <Circle size={10} />
          </div>
          <div className="truncate pr-12 text-xl font-semibold whitespace-nowrap @5xl:pr-4">
            {email.from_name}
          </div>
        </div>
        <div className="flex w-9/12 gap-2 text-xl @5xl:pl-2">
          <div className="truncate font-medium whitespace-nowrap @4xl:overflow-visible @4xl:text-clip">
            {email.subject}
          </div>
          <div className="ml-4 hidden truncate pr-8 font-light whitespace-nowrap @5xl:block">
            {wrapString(email.snippet, 110 - email.subject.length)}
          </div>
        </div>
      </div>
      <div className="absolute right-0 mr-4 group-hover:mr-5">
        <div className="group-hover:hidden">
          {email.received_date.slice(0, -15)}
        </div>
        <div className="hidden gap-3 group-hover:flex">
          <div
            className="hover:bg-amber-100"
            onClick={(e) => e.stopPropagation()}
          >
            <Check />
          </div>
          <div className="hover:bg-amber-100">
            <Star
              fill={email?.is_starred ? "yellow" : "none"}
              onClick={() => toggleStarred(email)}
            />
          </div>
          <div className="hover:bg-amber-100">
            <Clock />
          </div>
        </div>
      </div>
      <div className="w-3/12 text-left text-xl whitespace-nowrap @5xl:w-1/12"></div>
    </div>
  );
}
