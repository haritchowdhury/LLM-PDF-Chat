import { redirect } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { MessageSquareText } from "lucide-react";
import { auth } from "@/lib/auth";

const Home = async () => {
  const session = await auth();
  if (!session) redirect("/sign-in");
  return (
    <main className="flex relative items-center justify-center min-h-screen bg-black">
            <Link href="/chat" className={buttonVariants()}>
              Chat with PDF
              <MessageSquareText />
            </Link>
    </main>
  );
}

export default Home;
