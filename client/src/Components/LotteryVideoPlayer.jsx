import React from "react";
import { PlayCircle, Sparkles } from "lucide-react";

const VIDEO_URL =
  "https://player.mediadelivery.net/play/769180/e3144a3a-a45d-494f-a9c7-142c6bdef4dd";

const LotteryVideoPlayer = ({
  title = "How It Works & Winning Guide",
  subtitle = "Watch step-by-step video on how to play and win",
  className = "",
  containerClassName = "",
}) => {
  return (
    <div className={containerClassName}>
      <section
        className={`overflow-hidden rounded-[18px] border border-[#e2e8f0] bg-white p-3 shadow-md ${className}`}
      >
        {/* Video Card Header */}
        <div className="mb-2.5 flex items-center justify-between gap-2 px-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ed1d43] to-[#be123c] text-white shadow-sm">
              <PlayCircle size={18} strokeWidth={2.4} />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-[14px] font-extrabold text-[#173e70]">
                {title}
              </h3>
              <p className="truncate text-[10.5px] font-medium text-[#6b7280]">
                {subtitle}
              </p>
            </div>
          </div>

          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#ed1d43]/20 bg-[#ed1d43]/10 px-2 py-0.5 text-[9.5px] font-extrabold text-[#ed1d43]">
            <Sparkles size={11} />
            Tutorial
          </span>
        </div>

        {/* 16:9 Video Iframe Embed */}
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-inner">
          <iframe
            src={VIDEO_URL}
            title={title}
            loading="lazy"
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen={true}
          />
        </div>
      </section>
    </div>
  );
};

export default LotteryVideoPlayer;
