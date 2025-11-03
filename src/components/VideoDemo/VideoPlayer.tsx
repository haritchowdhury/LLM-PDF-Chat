"use client";

import { useState } from "react";

interface VideoPlayerProps {
  videoId: string;
  title?: string;
  description?: string;
}

const VideoPlayer = ({
  videoId,
  title = "Watch Our Demo",
  description = "Learn how to use our platform and see it in action",
}: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Video */}
      <div className="bg-gradient-to-br from-blue-50 to-green-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {title}
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {description}
            </p>
          </div>

          {/* Video Container */}
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                {!isPlaying ? (
                  <div
                    className="absolute inset-0 cursor-pointer group"
                    onClick={() => setIsPlaying(true)}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-40 transition-all">
                      <div className="bg-blue-600 rounded-full p-6 group-hover:scale-110 transition-transform">
                        <svg
                          className="w-16 h-16 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">🎓</div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Easy to Use
              </h4>
              <p className="text-gray-600">
                Get started in minutes with our intuitive interface and
                step-by-step guidance.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">⚡</div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Fast Results
              </h4>
              <p className="text-gray-600">
                Generate quizzes and start learning immediately with our
                AI-powered platform.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">💡</div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Smart Features
              </h4>
              <p className="text-gray-600">
                Leverage AI technology to create engaging content and track
                your progress.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-200 text-gray-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h5 className="text-lg font-semibold mb-4">Aiversety</h5>
              <p className="text-gray-600">
                Transforming content into engaging activities for better
                learning outcomes.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-800">
            <p>&copy; 2025 Aiversety. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VideoPlayer;
