"use client";
import React, { useState, useEffect } from "react";
import { FiUser, FiMoon, FiSun, FiChevronDown } from "react-icons/fi";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { MessageSquareText, CircleUserRound, User } from "lucide-react";
import ShareLinkModel from "@/components/ShareLink";
import { Upload } from "@prisma/client";
import Image from "next/image";

type Props = {
  id: string;
  platformlink: string;
  shares: Upload[];
};
const LandingPage = ({ id, platformlink, shares }: Props) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setArticles(shares);
      setLoading(false);
    }, 1500);
  }, []);

  const HeroSection = () => (
    <section className={`pt-24 pb-2  bg-black text-white`}>
      <div className="container mx-auto px-4 py-0 text-center">
        <div className="flex items-center justify-center">
          <Image
            src="/aiversety.jpg"
            alt="Aiversity Logo"
            width={75}
            height={75}
            className="rounded-lg shadow-md"
          />
        </div>
        <h1 className="text-4xl md:text-4xl font-bold mb-2">
          Skim Fast! Automate Retention
        </h1>
        <p className="text-xl md:text-xl mb-2 max-w-3xl mx-auto">
          Chat with your documents find important topics and take AI generated
          quizzes.
        </p>
        <Link href={`/chat/undefined`} className={buttonVariants()}>
          Shart here!
          <MessageSquareText />
        </Link>

        <p className="text-xl md:text-xl mb-2 max-w-3xl mx-auto">
          You can publish an article from your profile.
        </p>
        <Link href={`/profile/${id}`} className={buttonVariants()}>
          Profile
          <CircleUserRound />
        </Link>
      </div>
    </section>
  );

  const ArticleCard = ({ article }) => (
    <article
      className={`rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105 bg-black h-32`}
    >
      <div className="p-6">
        <Link href={`/chat/${article.id}`}>
          <h3 className={`text-xl font-bold mb-2 text-white`}>
            {article.name}
          </h3>
        </Link>
        <div className={`flex items-center justify-between text-gray-400"  `}>
          <span>
            <ShareLinkModel link={`${platformlink}${article.id}`} />
          </span>
          <span>
            <Link
              href={`/profile/${article.userId}`}
              className={buttonVariants()}
            >
              <User />{" "}
            </Link>
          </span>
        </div>
      </div>
    </article>
  );

  const SkeletonCard = () => (
    <div className={`rounded-lg overflow-hidden shadow-lg bg-black`}>
      <div className="w-full h-48 bg-gray-300 animate-pulse" />
      <div className="p-6">
        <div className="h-6 bg-gray-300 rounded animate-pulse mb-2" />
        <div className="h-4 bg-gray-300 rounded animate-pulse mb-2" />
        <div className="h-4 bg-gray-300 rounded animate-pulse mb-4" />
        <div className="flex justify-between">
          <div className="h-4 w-20 bg-gray-300 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-300 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={
        "bg-gray-900 min-h-screen h-full overflow-y-auto flex flex-col"
      }
    >
      <HeroSection />
      <p className="text-xl md:text-xl  text-white p-4 max-w-2xl mx-auto text-center">
        Explore published articles.
      </p>
      <main className="container mx-auto px-4 py-2 flex flex-grow item-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pb-16">
          {loading
            ? Array(6)
                .fill(0)
                .map((_, index) => <SkeletonCard key={index} />)
            : articles &&
              articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
