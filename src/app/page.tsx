import { redirect } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { MessageSquareText, CircleUserRound, User } from "lucide-react";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import db from "@/lib/db/db";
import ShareLinkModel from "@/components/ShareLink";
import { headers } from "next/headers";
import LandingPage from "@/components/LandingPage";
const Home = async () => {
  const session = await auth();
  if (!session) redirect("/sign-in");
  const id = String(session.user.id);

  const headersList = await headers();
  const host = await headersList.get("host");
  const platformlink = `http://${host as string}/chat/`;

  const Shares = await db.upload.findMany({
    where: { private: false, isDeleted: false },
  });

  return <LandingPage id={id} platformlink={platformlink} shares={Shares} />;
  {
    /* <main className="flex flex-col items-center min-h-screen bg-black p-2">
      <Card
        className="flex flex-col gap-4 text-white bg-black border-gray-800 p-12 
                      h-[90vh] overflow-y-auto w-full max-w-md sm:max-w-lg lg:max-w-2xl mt-4 sm:mt-8"
      >
        <Card className="border-none bg-gray-800 p-5 font-bold text-white">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Image
                src="/aiversety.jpg"
                alt="Aiversity Logo"
                width={75}
                height={75}
                className="rounded-lg shadow-md"
              />
            </Link>
            <div className="text-gray-300">Skim fast, automate retention!</div>
          </div>{" "}
        </Card>

        <Link href={`/profile/${id}`} className={buttonVariants()}>
          Profile
          <CircleUserRound />
        </Link>
        <Card className="flex justify-center w-full bg-gray-800 text-gray-200 font-bold border-none p-2">
          You can publish an article and share with the community from your
          profile.
        </Card>
        <Link href={`/chat/undefined`} className={buttonVariants()}>
          Shart here!
          <MessageSquareText />
        </Link>
        <Card className="flex justify-center w-full bg-gray-800 text-gray-200 font-bold border-none p-2">
          Upload your private documents and ask our Agent!
        </Card>
        <hr className="m-0 border-gray-800" />

        <Card className="p-3 bg-black border-gray-900 text-gray-200">
          <CardTitle className="text-center text-sm">
            Explore Community Articles
          </CardTitle>
          <div className="flex flex-wrap gap-3 mt-2">
            {Shares.map((share) => (
              <div
                key={share.id}
                className="flex flex-wrap justify-center items-center gap-1"
              >
                <Link href={`/chat/${share.id}`} className={buttonVariants()}>
                  {share.name.slice(0, 25)}
                  <MessageSquareText />
                </Link>
                <ShareLinkModel link={`${platformlink}${share.id}`} />
                <Link
                  href={`/profile/${share.userId}`}
                  className={buttonVariants()}
                >
                  <User />{" "}
                </Link>
              </div>
            ))}
          </div>
        </Card>
      </Card>
    </main> */
  }
};

export default Home;
