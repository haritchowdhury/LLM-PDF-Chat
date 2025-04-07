"use client";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { CircleUserRound } from "lucide-react";

import Image from "next/image";
import { Card /*CardContent, CardTitle*/ } from "@/components/ui/card";

const LandingPage = () => {
  const HeroSection = () => (
    <section
      className="relative pt-24 pb-2 text-white overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url('/milkyway.jpg')",
        backgroundSize: "cover",
      }}
    >
      <div className="container mx-auto px-4 py-0 text-center ">
        <div className="flex items-center justify-center ">
          <Image
            src="/aiversety.png"
            alt="Aiversity Logo"
            width={200}
            height={200}
            className="rounded-lg shadow-md"
          />
        </div>
        <h1 className="text-4xl md:text-4xl font-bold mb-2 pb-6">
          First AI publishing Platform
        </h1>

        <p className="text-xl md:text-2xl mb-2 max-w-3xl mx-auto pb-6">
          Publish your articles with one click, earn a flat 50% for every
          on-chain transaction.
        </p>
        <Link
          href="/sign-up"
          className="
            relative inline-flex items-center justify-center gap-2
            px-6 py-3 overflow-hidden
            font-medium text-white rounded-lg
            bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900
            hover:from-gray-800 hover:via-gray-900 hover:to-black
            shadow-lg transition-all duration-300 ease-out
            hover:shadow-gray-700/40
            group
        "
        >
          {/* Shine effect */}
          <span
            className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r 
                from-transparent via-white/20 to-transparent
                transition-all duration-1000 ease-in-out
                group-hover:left-[100%]"
            style={{ transform: "skewX(-25deg)" }}
          ></span>

          {/* Button text and icon */}
          <span className="relative flex items-center gap-2">
            Sign up
            <CircleUserRound className="w-5 h-5" />
          </span>
        </Link>
        <p className="text-xl md:text-2xl mb-2 max-w-3xl mx-auto pt-6 pb-6">
          Or organize your research with our personal work-spaces.
        </p>
      </div>
    </section>
  );

  return (
    <div
      suppressHydrationWarning
      className={"bg-black min-h-screen h-full overflow-y-auto flex flex-col"}
    >
      <HeroSection />
      <main className="container mx-auto px-4 py-2 flex flex-grow item-center justify-center">
        <Card className="p-3 text-center bg-black border-none text-gray-200 flex flex-col items-center gap-4 w-full max-w-md pb-24">
          <div>Upload your documents using the tooltip.</div>
          <Image
            src="/upload.png"
            alt="Upload"
            width={500}
            height={50}
            className="rounded-lg shadow-md"
          />

          <div>
            Connect Metamask to unlock Milestones and take personalized Quizzes!
          </div>
          <Image
            src="/Quiz.png"
            alt="Quiz"
            width={500}
            height={50}
            className="rounded-lg shadow-md"
          />

          <div>
            Claim Milestones to get refunds! Remember to complete within 7 days.
          </div>
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
          <div>Happy Skimming!</div>
        </Card>
      </main>
    </div>
  );
};

export default LandingPage;
