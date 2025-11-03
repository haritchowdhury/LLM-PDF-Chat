"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import ShareLinkModal from "@/components/ShareLink";

// Mock components for demonstration - replace with your actual imports
const buttonVariants = ({ variant, className }) => className;

// Icons
const Calendar = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const Clock = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const FileText = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const BookOpen = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
  </svg>
);

const MessageSquareText = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    <line x1="9" y1="10" x2="15" y2="10"></line>
    <line x1="9" y1="14" x2="13" y2="14"></line>
  </svg>
);

const ExternalLink = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

const Share2 = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <circle cx="18" cy="5" r="3"></circle>
    <circle cx="6" cy="12" r="3"></circle>
    <circle cx="18" cy="19" r="3"></circle>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
  </svg>
);

// Type definition for shares
type Share = {
  id: string;
  name: string;
  description?: string;
  timeStarted: Date;
  userId: string;
  user: { id: string; name: string };
};

// Sample data
const sampleShares: Share[] = [
  {
    id: "1",
    name: "Introduction to Machine Learning Fundamentals",
    description:
      "Learn the basics of machine learning including supervised and unsupervised learning, neural networks, and practical applications.",
    timeStarted: new Date(2024, 9, 15, 10, 30),
    userId: "user1",
    user: { id: "user1", name: "Dr. Sarah Johnson" },
  },
  {
    id: "2",
    name: "Advanced React Patterns and Best Practices",
    description:
      "Master advanced React concepts including custom hooks, context API, performance optimization, and modern state management.",
    timeStarted: new Date(2024, 9, 20, 14, 15),
    userId: "user2",
    user: { id: "user2", name: "Michael Chen" },
  },
  {
    id: "3",
    name: "Digital Marketing Strategies for 2024",
    description:
      "Comprehensive guide to modern digital marketing including SEO, social media marketing, content strategy, and analytics.",
    timeStarted: new Date(2024, 10, 1, 9, 0),
    userId: "user3",
    user: { id: "user3", name: "Emily Rodriguez" },
  },
  {
    id: "4",
    name: "Python Data Science Bootcamp",
    description:
      "Complete data science course covering pandas, numpy, matplotlib, and machine learning with Python.",
    timeStarted: new Date(2024, 10, 5, 11, 45),
    userId: "user4",
    user: { id: "user4", name: "James Wilson" },
  },
  {
    id: "5",
    name: "UI/UX Design Principles",
    description:
      "Learn essential design principles, user research methods, wireframing, prototyping, and creating engaging user experiences.",
    timeStarted: new Date(2024, 10, 10, 13, 20),
    userId: "user5",
    user: { id: "user5", name: "Alexandra Kim" },
  },
  {
    id: "6",
    name: "Blockchain and Cryptocurrency Basics",
    description:
      "Understanding blockchain technology, cryptocurrencies, smart contracts, and decentralized applications.",
    timeStarted: new Date(2024, 10, 12, 15, 30),
    userId: "user1",
    user: { id: "user1", name: "Dr. Sarah Johnson" },
  },
  {
    id: "7",
    name: "Cloud Computing with AWS",
    description:
      "Comprehensive AWS training covering EC2, S3, Lambda, and cloud architecture best practices.",
    timeStarted: new Date(2024, 10, 18, 10, 0),
    userId: "user6",
    user: { id: "user6", name: "Robert Martinez" },
  },
  {
    id: "8",
    name: "Business Analytics and Data Visualization",
    description:
      "Learn to analyze business data and create compelling visualizations using modern tools and techniques.",
    timeStarted: new Date(2024, 10, 22, 16, 45),
    userId: "user7",
    user: { id: "user7", name: "Lisa Thompson" },
  },
];

const LandingPage = ({
  id = "user1",
  platformlink = "/classroom/",
  shares = sampleShares,
}: {
  id?: string;
  platformlink?: string;
  shares?: Share[];
}) => {
  const [articles, setArticles] = useState([]);
  const [displayedArticles, setDisplayedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef(null);

  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    setTimeout(() => {
      const sortedShares = [...shares].sort((a, b) => {
        const dateA = new Date(a.timeStarted).getTime();
        const dateB = new Date(b.timeStarted).getTime();
        return dateB - dateA; // Most recent first
      });
      setArticles(sortedShares);
      setDisplayedArticles(sortedShares.slice(0, ITEMS_PER_PAGE));
      setLoading(false);
      setHasMore(sortedShares.length > ITEMS_PER_PAGE);
    }, 1500);
  }, [shares]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;

    const nextPage = page + 1;
    const startIndex = page * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const newArticles = articles.slice(startIndex, endIndex);

    if (newArticles.length > 0) {
      setDisplayedArticles((prev) => [...prev, ...newArticles]);
      setPage(nextPage);
      setHasMore(endIndex < articles.length);
    } else {
      setHasMore(false);
    }
  }, [articles, page, hasMore, loading]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, loading]);

  const ArticleCard = ({ article }) => {
    const formattedDate = article.timeStarted
      ? new Date(article.timeStarted).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Recent";

    const formattedTime = article.timeStarted
      ? new Date(article.timeStarted).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    const timeAgo = article.timeStarted
      ? getTimeAgo(new Date(article.timeStarted))
      : "Recently";

    return (
      <article className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 mb-6 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <Link
              href={`/profile/${article.userId}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                {article.user.name?.charAt(0).toUpperCase() || "A"}
              </div>
              <div>
                <p className="font-semibold text-gray-800">
                  {article.user.name || "Anonymous User"}
                </p>
                <p className="text-sm text-gray-500">{timeAgo}</p>
              </div>
            </Link>
            <ShareLinkModal link={`${platformlink}${article.id}`} />
          </div>

          <Link href={`/chat/${article.id}`} className="block group">
            <h3 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 break-words">
              {article.name}
            </h3>
          </Link>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-gray-200 my-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm font-medium">{formattedDate}</p>
              </div>
            </div>

            {formattedTime && (
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="text-sm font-medium">{formattedTime}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-gray-600">
              <FileText className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Type</p>
                <p className="text-sm font-medium">Classroom</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <BookOpen className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm font-medium text-green-600">Public</p>
              </div>
            </div>
          </div>

          {article.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-3 break-words leading-relaxed">
              {article.description}
            </p>
          )}

          <div className="mt-4">
            <Link
              href={`/chat/${article.id}`}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquareText className="h-4 w-4" />
              Start Chat
            </Link>
          </div>
        </div>
      </article>
    );
  };

  const SkeletonCard = () => (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 mb-6 overflow-hidden">
      <div className="p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-200" />
            <div>
              <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-20 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="h-8 w-8 bg-gray-200 rounded" />
        </div>
        <div className="h-8 bg-gray-200 rounded mb-3 w-3/4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-gray-200 my-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-200 rounded" />
              <div className="flex-1">
                <div className="h-3 w-12 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-full" />
        <div className="h-4 bg-gray-200 rounded mb-4 w-5/6" />
        <div className="flex gap-3">
          <div className="h-10 bg-gray-200 rounded flex-1" />
          <div className="h-10 w-10 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
      }
    }
    return "Just now";
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <section className="container mx-auto px-4 sm:px-6 py-12 pt-20 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Explore Public Classrooms
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover and engage with classrooms created by educators around the
            world. Start learning today!
          </p>
        </div>

        {loading ? (
          <div>
            {Array(3)
              .fill(0)
              .map((_, index) => (
                <SkeletonCard key={index} />
              ))}
          </div>
        ) : displayedArticles && displayedArticles.length > 0 ? (
          <>
            {displayedArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}

            {hasMore && (
              <div ref={observerTarget} className="py-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            )}

            {!hasMore && displayedArticles.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">You've reached the end!</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-md border border-gray-200">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-6">
              No classrooms published yet.
            </p>
            <Link
              href={`/profile/${id}`}
              className="inline-block border border-gray-600 text-gray-500 hover:bg-gray-100 hover:text-gray-900 px-6 py-2 rounded-lg transition-colors"
            >
              Publish your first classroom{" "}
              <ExternalLink className="ml-2 h-4 w-4 inline" />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default LandingPage;
