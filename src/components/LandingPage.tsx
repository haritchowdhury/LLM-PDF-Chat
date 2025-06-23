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

type UploadWithUser = Upload & {
  user: {
    id: string;
    name: string | null;
  };
};

type Props = {
  id: string;
  platformlink: string;
  shares: UploadWithUser[];
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
      <article className="rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl hover:translate-y-[-4px] bg-white border border-gray-200">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
          <Link href={`/chat/${article.id}`} className="block group">
            <h3 className="text-lg sm:text-xl font-bold mb-3 text-gray-800 group-hover:text-blue-300 transition-colors line-clamp-2 break-words leading-tight">
              {article.name}
            </h3>
            {/* <p className="text-gray-600 text-sm mb-4 line-clamp-2 break-words">
              {article.description ||
                "Chat with this document to explore its contents and test your knowledge."}
            </p>*/}
          </Link>
          <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-200">
            <Link
              href={`/profile/${article.userId}`}
              className="flex items-center text-sm text-gray-500 hover:text-blue-300"
            >
              <User className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">
                {article.user.name || "Anonymous User"}
              </span>
              <span className="sm:hidden">
                {article.user.name?.split(" ")[0] || "Anonymous"}
              </span>
            </Link>
            <ShareLinkModel link={`${platformlink}${article.id}`} />
          </div>
        </div>
      </article>
    );
  };

  const SkeletonCard = () => (
    <div className="rounded-xl overflow-hidden shadow-lg bg-gray-100 border border-gray-200">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-4 bg-white rounded animate-pulse" />
          <div className="h-4 w-24 bg-white rounded animate-pulse" />
        </div>
        <div className="h-7 bg-white rounded animate-pulse mb-3" />
        <div className="h-4 bg-white rounded animate-pulse mb-2 w-full" />
        <div className="h-4 bg-white rounded animate-pulse mb-4 w-3/4" />
        <div className="pt-3 border-t border-gray-200 mt-2">
          <div className="flex justify-between">
            <div className="h-4 w-24 bg-white rounded animate-pulse" />
            <div className="h-4 w-16 bg-white rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-b from-gray-200 to-white min-h-screen">
      {/* <HeroSection /> */}

      <section className="container mx-auto px-6 py-12 pt-20">
        <div className="flex flex-col items-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Explore Public Classrooms
          </h2>
          <p className="text-xl text-gray-700 max-w-2xl text-center">
            Explore Public Classrooms created by other teachers like you.
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
              <p className="text-xl text-gray-600 mb-6">
                No articles published yet.
              </p>
              <Link
                href={`/profile/${id}`}
                className={buttonVariants({
                  variant: "outline",
                  className:
                    "border-gray-600 text-gray-500 hover:bg-white-700 hover:text-gray-900",
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
