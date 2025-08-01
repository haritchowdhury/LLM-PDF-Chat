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
import HomePage from "@/components/HomePage";
import Landing from "@/components/LandingPage/Landing";

const Home = async () => {
  const session = await auth();

  const headersList = await headers();
  const host = await headersList.get("host");
  const platformlink = `http://${host as string}/chat/`;

  if (session) {
    const Shares = await db.upload.findMany({
      where: { private: false, isDeleted: false },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            // Add other user fields you might need like email, image, etc.
          },
        },
      },
    });
    return (
      <LandingPage
        id={session?.user.id}
        platformlink={platformlink}
        shares={Shares}
      />
    );
  } else {
    //return <HomePage />;
    return <Landing />;
  }
};

export default Home;
