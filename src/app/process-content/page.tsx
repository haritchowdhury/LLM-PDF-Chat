import { auth } from "@/lib/auth";
import ProcessContent from "@/components/ProcessContext";
const Process = async () => {
  const session = await auth();
  return <ProcessContent session={session} />;
};
export default Process;
