// import EmailListDisplay from "@/features/Inbox/components/EmailListDisplay";
import EmailListDisplay from "@/components/common/EmailListDisplay";
import LabelOptions from "@/features/Inbox/components/LabelOptions";

function EmailListLayout({ navigateTo }: { navigateTo: string }) {
  return (
    <div className="flex h-full w-full flex-col">
      <LabelOptions />
      <EmailListDisplay navigateTo={navigateTo} />
    </div>
  );
}

export default EmailListLayout;
