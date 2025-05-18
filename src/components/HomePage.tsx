"use client";
import Link from "next/link";
import {
  CircleUserRound,
  ArrowRight,
  Upload,
  FileText,
  Lightbulb,
  DollarSign,
} from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";

const HomePage = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const animateClass = isVisible
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-10";

  const HeroSection = () => (
    <section
      className="relative pt-16 pb-12 text-white overflow-hidden bg-cover bg-center bg-no-repeat min-h-screen flex items-center justify-center"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.9)), url('/milkyway.jpg')",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-80"></div>

      <div className="container mx-auto px-4 py-0 text-center relative z-10 transition-all duration-700 ease-out">
        <div
          className={`flex items-center justify-center mb-8 transition-all duration-1000 ${animateClass}`}
        >
          <Image
            src="/aiversety.png"
            alt="Aiversity Logo"
            width={220}
            height={220}
            className="rounded-lg shadow-xl"
          />
        </div>

        <h1
          className={`text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-400 transition-all duration-1000 delay-300 ${animateClass}`}
        >
          Publish your RAG bots in one click
        </h1>

        <p
          className={`text-xl md:text-2xl mb-8 max-w-2xl mx-auto text-gray-200 transition-all duration-1000 delay-500 ${animateClass}`}
        >
          Create your own RAG bots on the fly, never worry about FAQs again.
        </p>

        <div
          className={`mb-12 transition-all duration-1000 delay-700 ${animateClass}`}
        >
          <Link
            href="/sign-up"
            className="
              relative inline-flex items-center justify-center gap-2
              px-8 py-4 overflow-hidden
              font-bold text-lg text-white rounded-lg
              bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-300
              text-black
              hover:shadow-lg hover:shadow-yellow-500/30
              transition-all duration-300 ease-out
              group
              transform hover:scale-105
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
            <span className="relative flex items-center gap-2">
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </span>
          </Link>
        </div>

        <p
          className={`text-xl md:text-2xl mb-4 max-w-3xl mx-auto text-gray-300 transition-all duration-1000 delay-900 ${animateClass}`}
        >
          Or organize your research with our personal work-spaces.
        </p>

        <div
          className={`flex justify-center transition-all duration-1000 delay-1000 ${animateClass}`}
        >
          <div className="animate-bounce mt-12 text-yellow-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );

  const FeatureSection = () => (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center text-yellow-200 mb-16">
          Why Choose AIversety?
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/10">
            <div className="flex justify-center mb-4">
              <div className="bg-yellow-500/20 p-3 rounded-full">
                <FileText className="w-10 h-10 text-yellow-300" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-yellow-100 mb-3 text-center">
              Smart Research Management
            </h3>
            <p className="text-gray-300 text-center">
              Upload and organize all your documents in private workspaces
              designed for seamless research.
            </p>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/10">
            <div className="flex justify-center mb-4">
              <div className="bg-yellow-500/20 p-3 rounded-full">
                <Lightbulb className="w-10 h-10 text-yellow-300" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-yellow-100 mb-3 text-center">
              Personalized Learning
            </h3>
            <p className="text-gray-300 text-center">
              Find important topics and take custom quizzes to enhance your
              understanding and retention.
            </p>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/10">
            <div className="flex justify-center mb-4">
              <div className="bg-yellow-500/20 p-3 rounded-full">
                <DollarSign className="w-10 h-10 text-yellow-300" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-yellow-100 mb-3 text-center">
              Publish your RAG bots
            </h3>
            <p className="text-gray-300 text-center">
              Publish your RAG bots and share it across social media, all with
              our simple one-click system.
            </p>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <div
      suppressHydrationWarning
      className={"bg-black min-h-screen h-full overflow-y-auto flex flex-col"}
    >
      <HeroSection />
      <FeatureSection />

      <main className="container mx-auto px-4 py-16 flex flex-grow">
        <div className="grid md:grid-cols-2 gap-12 w-full">
          <Card className="p-8 text-center bg-gray-900 border-gray-800 rounded-xl shadow-xl hover:shadow-yellow-500/5 transition-all duration-300 flex flex-col items-center gap-6">
            <div className="md:text-3xl text-2xl font-bold text-yellow-200 mb-4">
              Manage your research in Private Workspaces
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <Image
                  src="/upload.png"
                  alt="Upload"
                  width={500}
                  height={50}
                  className="rounded-xl shadow-lg border border-gray-800"
                />
                <p className="text-lg text-gray-300">
                  Upload your documents using the tooltip
                </p>
              </div>

              <div className="space-y-4">
                <Image
                  src="/Quiz.png"
                  alt="Quiz"
                  width={500}
                  height={50}
                  className="rounded-xl shadow-lg border border-gray-800"
                />
                <p className="text-lg text-gray-300">
                  Find important topics and take personalized quizzes!
                </p>
              </div>

              <div className="space-y-4">
                <Image
                  src="/product.png"
                  alt="Chat room"
                  width={500}
                  height={50}
                  className="rounded-xl shadow-lg border border-gray-800"
                />
                <p className="text-lg text-gray-300">Happy Skimming!</p>
              </div>
            </div>
          </Card>

          <Card className="p-8 text-center bg-gray-900 border-gray-800 rounded-xl shadow-xl hover:shadow-yellow-500/5 transition-all duration-300 flex flex-col items-center gap-6">
            <div className="md:text-3xl text-2xl font-bold text-yellow-200 mb-4">
              Publish and Monetise easily
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <Image
                  src="/Publish.png"
                  alt="Publish"
                  width={100}
                  height={50}
                  className="rounded-xl shadow-lg border border-gray-800"
                />
                <p className="text-lg text-gray-300">
                  Click Publish button from your profile. Select the document.
                </p>
              </div>

              <div className="space-y-4">
                <Image
                  src="/published.png"
                  alt="Monetise"
                  width={500}
                  height={50}
                  className="rounded-xl shadow-lg border border-gray-800"
                />
                <p className="text-lg text-gray-300">
                  Share the RAG bot link across social media platforms!
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <section className="bg-black py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-yellow-200 mb-8">
            Ready to get started?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join AIversety today and transform how you publish, share, and
            monetize your research.
          </p>
          <Link
            href="/sign-up"
            className="
              inline-flex items-center justify-center gap-2
              px-8 py-4
              font-bold text-lg text-black rounded-lg
              bg-yellow-300 hover:bg-yellow-400
              transition-all duration-300 ease-out
              shadow-lg hover:shadow-yellow-400/30
              transform hover:scale-105
          "
          >
            Sign up now
            <CircleUserRound className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>© {new Date().getFullYear()} AIversety. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
