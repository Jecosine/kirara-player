"use client";
import React, {useEffect, useRef, useState} from 'react';
import {Danmaku} from "./api/danmaku";
import DanmakuRenderer from "./DanmakuRenderer";
import ReactPlayer from "react-player";
import KVideoControls from "./KVideoControls";

interface KVideoProps {
  src: string;
  poster?: string;
  width?: number;
  height?: number;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  preload?: 'auto' | 'metadata' | 'none';
  danmaku: Danmaku[];
}


export default function KiraraPlayer({
                                       src,
                                       poster,
                                       preload,
                                       loop,
                                       autoplay,
                                       muted,
                                       controls,
                                       height,
                                       width,
                                       danmaku
                                     }: KVideoProps) {
  // load local video file to blob
  const [videoBlob, setVideoBlob] = useState<Blob>();
  const [videoUrl, setVideoUrl] = useState<string>();
  // video element
  const videoRef = useRef<HTMLDivElement | null>(null);


  // load local video file from src
  useEffect(() => {
    fetch(src)
      .then(res => res.blob())
      .then(blob => {
        setVideoBlob(blob);
      });
  }, [src]);
  // load local video file to url
  useEffect(() => {
    if (videoBlob) {
      setVideoUrl(URL.createObjectURL(videoBlob));
    }
  }, [videoBlob]);
  // useEffect(() => {
  //   setVideoUrl(src);
  // }, []);
  // watch video fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [pip, setPip] = useState(false);
  const [showDanmaku, setShowDanmaku] = useState(true);
  const [subtitle, setSubtitle] = useState("");
  const [speed, setSpeed] = useState(1.0);
  const [volume, setVolume] = useState(0.7);
  const [nextEpisode, setNextEpisode] = useState("");
  const [prevEpisode, setPrevEpisode] = useState("");
  const [showControls, setShowControls] = useState(true);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [played, setPlayed] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [cursorLowerSide, setCursorLowerSide] = useState(false);
  const [cursorIdleTimer, setCursorIdleTimer] = useState<NodeJS.Timeout>();
  const [videoWidth, setVideoWidth] = useState(1280);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [dps, setDps] = useState(0);
  const pipContainerRef = useRef<HTMLDivElement | null>(null);
  // watch video width
  useEffect(() => {
    function handleResize() {
      if (videoRef.current) {
        console.log("video width: ", videoRef.current!.clientWidth);
        setVideoWidth(videoRef.current!.clientWidth);
      }
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  // typing for resize event on element
  const handlePipResize = (e: Event) => {
    //@ts-ignore
    console.log(">>>>>>", e.currentTarget.innerWidth, `${0.03 * e.currentTarget.innerWidth}px`);
    //@ts-ignore
    console.log("pipWindow width: ", e.currentTarget.innerWidth, pipWindow);
    //@ts-ignore
    e.currentTarget.document.body.style.setProperty('--subtitle-font-size', `${0.03 * e.currentTarget.innerWidth}px`);
    //@ts-ignore
    setVideoWidth(e.currentTarget.innerWidth);

  }
  const calculateFontSize = (width: number) => {
    return width * 0.03;
  };
  const fontSize = calculateFontSize(videoWidth);
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current?.style.setProperty('--subtitle-font-size', `${fontSize}px`);
    }
  }, [fontSize]);


  const onDuration = (duration: number) => {
    setDuration(duration);
  }
  const onChange = (e: any) => {
    setPlayed(parseFloat(e.target.value));
  }
  const onProgress = (state: any) => {
    // console.log("onProgress: ", state)
    setTime(state.playedSeconds);
    setPlayed(state.played);
    setLoaded(state.loaded);
  }
  const onMouseMove = (e: MouseEvent) => {
    const video = containerRef.current;
    if (video) {
      setShowControls(true);
      setCursorLowerSide(e.clientY > video.clientHeight * 2 / 3);
    }
  }
  // hide controls and cursor after 3 seconds
  useEffect(() => {
    if (showControls) {
      if (cursorIdleTimer) {
        clearTimeout(cursorIdleTimer);
      }
      if (!cursorLowerSide) {
        const timer = setTimeout(() => {
          setShowControls(false);
        }, 3000);
        setCursorIdleTimer(timer);
      }
    }
  }, [showControls, cursorLowerSide]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onLeavePiP = function (this: any) {
    if (this !== pipWindow) return;
    const container = containerRef.current;
    container?.classList.remove("pip-mode");
    //@ts-ignore
    container?.append(videoRef.current);
  }
  // picture in picture for container
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (pip && video) {
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          console.log('User clicked "Previous Track" icon.');
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          console.log('User clicked "Next Track" icon.');
        });
        navigator.mediaSession.setActionHandler("seekto", () => {
          console.log("User clicked seek to icon.");
        });
        //@ts-ignore
        documentPictureInPicture.requestWindow({
          width: 640,
          height: 360,
          toolbar: "no", scrollbars: "no", menubar: "no"
        }).then((win: Window) => {
          setPipWindow(win);
          console.log("pipWindow: ", win);
          // move css to pip window
          [...document.styleSheets].map((sheet) => {
            if (sheet.href) {
              const link = document.createElement("link");
              link.href = sheet.href;
              link.rel = "stylesheet";
              win.document.head.append(link);
            }
          });

          // win.document.body.append(video.getInternalPlayer());
          win.document.body.append(containerRef.current as Node);
          let newbtn = win.document.createElement("div");
          newbtn.classList.add(...["absolute", "top-0", "right-0", "z-50", "bg-white", "border-2", "border-black", "px-2", "py-1", "rounded-md", "text-black", "w-10", "h-10"]);
          newbtn.innerText = "close";
          newbtn.onclick = () => {
            // @ts-ignore
            win.console.log("close");
          }
          win.addEventListener('click', (e) => {
            // @ts-ignore
            win.console.log('Document was clicked:', e);
          });
          win.document.body.appendChild(newbtn);
          win.document.body.style.setProperty('--subtitle-font-size', `${0.03 * win.innerWidth}px`);

          win.onresize = handlePipResize;
          win.addEventListener("pagehide", () => {
            //@ts-ignore
            pipContainerRef.current?.insertBefore(containerRef.current, pipContainerRef.current?.firstChild);
            setPip(false);
            console.log("hidepage");
          });
        });


        window.addEventListener("leavepictureinpicture", () => {
          setPip(false);
        });
      } else {
        if (document.pictureInPictureElement) {
          document.exitPictureInPicture();
          setPip(false);
        }

      }
    }
  }, [videoRef, pip]);

  // trigger controls show/hide if mouse is moving to lower 1/3 of the video screen
  useEffect(() => {
    const video = containerRef.current;
    if (video) {
      video.addEventListener("mousemove", onMouseMove);
      video.addEventListener("mouseleave", () => {
        setShowControls(false);
      });
      video.addEventListener("click", () => {
        setShowControls(true);
      });
    }

  }, [containerRef]);
  // video container
  const handleFullscreen = () => {
    if (containerRef && containerRef.current) {
      if (isFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        setIsFullscreen(document.fullscreenElement !== null);
      } else {
        //@ts-ignore
        containerRef.current.requestFullscreen({navigationUI: "hide"});
        setIsFullscreen(true);

      }
    }
  }


  // handle fullscreen change
  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
    }
  }, []);
  const [activeDanmakus, setActiveDanmakus] = useState<Danmaku[]>([]);
  return (
    <div className={"relative w-full h-full"} ref={pipContainerRef}>
      <div className={`relative video-container ${!showControls && "cursor-none"} w-full h-full`} ref={containerRef}>
        {videoUrl && <ReactPlayer
            ref={videoRef}
            config={{
              file: {
                tracks: [
                  {kind: "subtitles", src: "/videos/MyGo/output.vtt", srcLang: "ja", default: true},
                ]
              }
            }}
            className={"w-full h-full"}
            url={videoUrl}
            poster={poster}
            preload={preload}
            loop={loop}
            playing={isPlaying}
            muted={isMuted}
            controls={false}
            volume={volume}
            width={"100%"}
            height={"100%"}
            onDuration={onDuration}
            onChange={onChange}
            onProgress={onProgress}
            onPlay={() => setIsPlaying(true)}
        />
        }

        {!pip && <KVideoControls
            isFullscreen={isFullscreen}
            setIsFullscreen={handleFullscreen}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            played={played}
            setPlayed={setPlayed}
            duration={duration}
            speed={speed}
            setSpeed={setSpeed}
            showControls={showControls}
            showDanmaku={showDanmaku}
            setShowDanmaku={setShowDanmaku}
            volume={volume}
            setVolume={setVolume}
            subtitle={subtitle}
            setSubtitle={setSubtitle}
            seeking={seeking}
            setSeeking={setSeeking}
            videoRef={videoRef}
            pip={pip}
            setPip={setPip}
        />}

        {/* render danmakus over video */}
        <div
          className={"absolute inset-0 flex flex-col pointer-events-none items-center justify-center w-full h-full border-white border-2"}>
          <div className={"absolute w-full h-full top-0"}>
            <DanmakuRenderer
              danmakus={danmaku} isPlaying={isPlaying} duration={duration} time={time}
              sad={setActiveDanmakus}
              config={{
                area: "half",
                speed: 1,
              }}
              sdps={setDps}
            />
          </div>
        </div>
      </div>
      <div className={"h-[200px] w-full overflow-scroll overflow-x-hidden"}>
        <div>{dps}</div>
        <div>{activeDanmakus.length}</div>
        {activeDanmakus.map((danmaku) => (
          <div key={danmaku.cid} className={"text-white"}>
            {Math.floor(danmaku.time / 5)} -{danmaku.time} - {danmaku.text}
          </div>
        ))}
      </div>
    </div>

  );
}

