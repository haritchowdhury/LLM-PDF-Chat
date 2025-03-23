import { redirect } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { MessageSquareText } from "lucide-react";
import { auth } from "@/lib/auth";
import db from "@/lib/db/db";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import Image from "next/image";

const Home = async () => {
  const session = await auth();
  if (!session) redirect("/sign-in");
  const id = String(session.user.id);

  const lastUpload = await db.upload.findMany({
    where: { userId: id },
    orderBy: { timeStarted: "desc" },
  });

  //const uploadId = lastUpload?.id;
  //const chatSession = `${id}_session`;
  //const space = `${id}_documents`;

  return (
    <main className="flex flex-col items-center min-h-screen bg-black p-2">
      <Card
        className="flex flex-col gap-4 text-white bg-black border-gray-800 p-12 
                      h-[90vh] overflow-y-auto w-full max-w-md sm:max-w-lg lg:max-w-2xl mt-4 sm:mt-8"
      >
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Image
              src="/aiversity.jpg"
              alt="Aiversity Logo"
              width={75}
              height={75}
              className="rounded-lg shadow-md"
            />
          </Link>
          <small className="text-gray-300">
            Skim fast, automate retention!
          </small>
        </div>

        {/* Demo Articles *
        <Card className="p-3 bg-black border-gray-900 text-gray-200">
          <CardTitle className="text-center text-sm">Demo articles!</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link
              href={`/chat/AttentionIsAllYouNeed`}
              className={buttonVariants()}
            >
              Attention is all you need
              <MessageSquareText />
            </Link>
            <Link href={`/chat/bitcoinWhitepaper`} className={buttonVariants()}>
              Bitcoin Whitepaper
              <MessageSquareText />
            </Link>
          </div>
        </Card> */}

        {/* Chat with PDF Button */}
        {lastUpload.map((upload) => (
          <Link
            key={upload.id}
            href={`/chat/${upload.id}`}
            className={buttonVariants()}
          >
            {upload.name.slice(0, 25)}
            <MessageSquareText />
          </Link>
        ))}

        <Link href={`/chat/undefined`} className={buttonVariants()}>
          Start a New Chat
          <MessageSquareText />
        </Link>

        {/* Upload & Features Section */}
        <Card className="p-3 bg-black border-gray-900 text-gray-200 flex flex-col items-center gap-4">
          <small>Upload your documents using the tooltip.</small>
          <Image
            src="/upload.png"
            alt="Upload"
            width={500}
            height={50}
            className="rounded-lg shadow-md"
          />

          <small>
            Connect Metamask to unlock Milestones and take personalized Quizzes!
          </small>
          <Image
            src="/Quiz.png"
            alt="Quiz"
            width={500}
            height={50}
            className="rounded-lg shadow-md"
          />

          <small>
            Claim Milestones to get refunds! Remember to complete within 7 days.
          </small>
          <Image
            src="/claim.png"
            alt="Claim Milestones"
            width={500}
            height={50}
            className="rounded-lg shadow-md"
          />

          <Image
            src="/product.png"
            alt="Claim Milestones"
            width={500}
            height={50}
            className="rounded-lg shadow-md"
          />
          <small>Happy Skimming!</small>
        </Card>
      </Card>
    </main>
  );
};

export default Home;
