"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  MessageSquareText,
  CircleUserRound,
  User,
  Share2,
  Calendar,
  ExternalLink,
} from "lucide-react";
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
    <section className="pt-20 pb-16 bg-gradient-to-b from-indigo-900 to-gray-900 text-white">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
          <div className="text-left md:w-1/2">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300">
              Skim Fast! Automate Retention
            </h1>
            <p className="text-xl mb-8 text-gray-200 max-w-lg">
              Chat with your documents, discover key insights, and reinforce
              learning with AI-generated quizzes.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/chat/undefined`}
                className={buttonVariants({
                  variant: "default",
                  size: "lg",
                  className: "bg-indigo-600 hover:bg-indigo-700 text-white",
                })}
              >
                Start chatting <MessageSquareText className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href={`/profile/${id}`}
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className: "border-gray-300 text-gray-800 hover:bg-gray-800",
                })}
              >
                View profile <CircleUserRound className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="relative">
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-purple-400 to-blue-500 opacity-75 blur"></div>
              <div className="relative bg-gray-800 p-8 rounded-lg shadow-xl">
                <Image
                  src="/aiversety.png"
                  alt="Aiversity Logo"
                  width={300}
                  height={300}
                  className="mx-auto rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const ArticleCard = ({ article }) => {
    // Format date if available
    const formattedDate = article.timeStarted
      ? new Date(article.timeStarted).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Recent";

    return (
      <article className="rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl hover:translate-y-[-4px] bg-gray-800 border border-gray-700">
        <div className="p-6">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
          <Link href={`/chat/${article.id}`} className="block group">
            <h3 className="text-xl font-bold mb-3 text-white group-hover:text-blue-300 transition-colors">
              {article.name.length > 40
                ? `${article.name.slice(0, 40)}...`
                : article.name}
            </h3>
            <p className="text-gray-300 text-sm mb-4 line-clamp-2">
              {article.description ||
                "Chat with this document to explore its contents and test your knowledge."}
            </p>
          </Link>
          <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-700">
            <Link
              href={`/profile/${article.userId}`}
              className="flex items-center text-sm text-gray-300 hover:text-blue-300"
            >
              <User className="h-4 w-4 mr-1" />
              <span>View profile</span>
            </Link>
            <ShareLinkModel link={`${platformlink}${article.id}`} />
          </div>
        </div>
      </article>
    );
  };

  const SkeletonCard = () => (
    <div className="rounded-xl overflow-hidden shadow-lg bg-gray-800 border border-gray-700">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-4 bg-gray-600 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-600 rounded animate-pulse" />
        </div>
        <div className="h-7 bg-gray-600 rounded animate-pulse mb-3" />
        <div className="h-4 bg-gray-600 rounded animate-pulse mb-2 w-full" />
        <div className="h-4 bg-gray-600 rounded animate-pulse mb-4 w-3/4" />
        <div className="pt-3 border-t border-gray-700 mt-2">
          <div className="flex justify-between">
            <div className="h-4 w-24 bg-gray-600 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-600 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-800 min-h-screen">
      <HeroSection />

      <section className="container mx-auto px-6 py-12">
        <div className="flex flex-col items-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Explore Published Articles
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl text-center">
            Browse through our collection of documents and start enhancing your
            learning experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-16">
          {loading ? (
            Array(6)
              .fill(0)
              .map((_, index) => <SkeletonCard key={index} />)
          ) : articles && articles.length > 0 ? (
            articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))
          ) : (
            <div className="col-span-3 text-center py-16">
              <p className="text-xl text-gray-400 mb-6">
                No articles published yet.
              </p>
              <Link
                href={`/profile/${id}`}
                className={buttonVariants({
                  variant: "outline",
                  className: "border-gray-600 text-gray-300 hover:bg-gray-700",
                })}
              >
                Publish your first article{" "}
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
