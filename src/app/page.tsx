import { auth } from "@/lib/auth";
import db from "@/lib/db/db";
import { headers } from "next/headers";
import Landing from "@/components/LandingPage/Landing";
import FeedPage from "@/components/LandingPage/FeedPage";

const Home = async () => {
  const session = await auth();

  const headersList = await headers();
  const host = await headersList.get("host");
  const platformlink = `http://${host as string}/chat/`;

  if (session) {
    const Shares = await db.upload.findMany({
      where: { private: false, isDeleted: false },
      select: {
        id: true,
        name: true,
        description: true,
        userId: true,
        timeStarted: true,
        likedBy: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { timeStarted: "desc" },
      take: 50, // Limit to 50 most recent
    });
    return (
      <FeedPage
        id={session?.user.id}
        platformlink={platformlink}
        shares={Shares}
      />
    );
  } else {
    return <Landing />;
  }
};

export default Home;
