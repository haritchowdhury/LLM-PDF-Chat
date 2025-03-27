import CommunityQuizForm from "@/components/CommunityQuizForm";
type Props = {
  upload: string;
  sessionId: string;
  namespace: string;
  showLoader: any;
  setShowLoader: any;
  userId: string;
};
const CommunityQuizBar = ({
  upload,
  sessionId,
  namespace,
  showLoader,
  setShowLoader,
  userId,
}: Props) => {
  return (
    <div>
      {" "}
      <CommunityQuizForm
        topic={""}
        id={upload}
        showLoader={showLoader}
        setShowLoader={setShowLoader}
      />
    </div>
  );
};

export default CommunityQuizBar;
