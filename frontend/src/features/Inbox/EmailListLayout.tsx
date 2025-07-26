// import EmailListDisplay from "@/features/Inbox/components/EmailListDisplay";
import EmailListDisplay from "@/components/common/EmailListDisplay";
import LabelOptions from "@/features/Inbox/components/LabelOptions";

function EmailListLayout() {
  return (
    <div className="@container flex h-full w-full flex-col">
      <div className="">
        <LabelOptions />
      </div>
      <EmailListDisplay />
    </div>
  );
}

export default EmailListLayout;
