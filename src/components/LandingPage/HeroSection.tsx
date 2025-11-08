import Link from "next/link";
const HeroSection = () => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-green-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Turn Study Materials Into
          <span className="text-blue-600"> Interactive Quizzes</span>
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Help students learn better with AI-generated quizzes, chatbots from
          any URL or PDF. Perfect for teachers creating assessments and parents
          supporting homework.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/sign-in"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Get Started Free
          </Link>
          <Link
            href="/demo"
            className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white 0 transition-colors"
          >
            Watch Demo
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
