import VideoPlayer from "@/components/VideoDemo/VideoPlayer";

const DemoPage = () => {
  return (
    <div className="pt-8">
      {" "}
      <VideoPlayer
        videoId="dQw4w9WgXcQ"
        title="Watch Our Demo"
        description="Learn how to transform your study materials into interactive quizzes with our AI-powered platform"
      />
    </div>
  );
};

export default DemoPage;
