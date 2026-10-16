import Hero from "../Components/Hero";
import HomeLotterySection from "../Components/HomeLotterySection";

const HOME_VIDEO_URL =
  "https://player.mediadelivery.net/play/781705/ba7cf0a4-a4b5-457b-b945-24465b45bff8";

const HomePage = () => {
  return (
    <>
      <Hero />
      <HomeLotterySection videoUrl={HOME_VIDEO_URL} />
    </>
  );
};

export default HomePage;
