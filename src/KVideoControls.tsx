// @ts-nocheck
import "boxicons/css/boxicons.min.css";
import {animated, useSpring} from "@react-spring/web";
import {UseSpringProps} from "react-spring";
import FormattedTime from "./FormattedTime";
import React, {useEffect, useRef, useState} from "react";
import BaseReactPlayer from "react-player";

interface KVideoControlsProps {
  isFullscreen: boolean;
  setIsFullscreen: () => void;

  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;

  played: number;
  setPlayed: (played: number) => void;

  duration: number;

  isMuted: boolean;
  setIsMuted: (isMuted: boolean) => void;

  nextEpisode?: () => void;
  prevEpisode?: () => void;

  speed: number;
  setSpeed: (speed: number) => void;

  showDanmaku: boolean;
  setShowDanmaku: (showDanmaku: boolean) => void;

  subtitle: string;
  setSubtitle: (subtitle: string) => void;

  showControls: boolean;

  seeking: boolean;
  setSeeking: (seeking: boolean) => void;

  videoRef: React.MutableRefObject<HTMLDivElement | null>;

  volume: number;
  setVolume: (volume: number) => void;

  pip: boolean;
  setPip: (pip: boolean) => void;
}

export default function KVideoControls(
  {
    isFullscreen,
    setIsFullscreen,
    isPlaying,
    setIsPlaying,
    played,
    setPlayed,
    duration,
    isMuted,
    setIsMuted,
    nextEpisode,
    prevEpisode,
    speed,
    setSpeed,
    showDanmaku,
    setShowDanmaku,
    subtitle,
    setSubtitle,
    showControls,
    // seeking,
    // setSeeking,
    volume,
    setVolume,
    videoRef,
    pip,
    setPip,
  }: KVideoControlsProps
) {
  const [seekingVolume, setSeekingVolume] = useState(false);
  const [showMark, setShowMark] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  // video player controls animation
  const controlsAnimation = useSpring(
    {opacity: showControls ? 1 : 0, config: {duration: 150}} as UseSpringProps
  );
  const progressAnimation = useSpring(
    {width: `${played * 100}%`} as UseSpringProps
  );
  const onChange = (e: any) => {
    setPlayed(parseFloat(e.target.value));
  }
  const progressRef = useRef<HTMLDivElement | null>(null);
  const setProgress = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef?.current) {
      //@ts-ignore
      const rect = progressRef.current?.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      return Math.min(x / width, 1);
    }
    return;
  }
  const setVolumeProgress = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsMuted(false);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const p = Math.max(Math.min(x / width, 1), 0);
    if (p < 0.001) {
      setIsMuted(true);
    }
    setVolume(p);
  }

  const onSeekingClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const p = setProgress(e);

    if (p !== undefined && videoRef?.current && "seekTo" in videoRef?.current) {
      console.log("seeking to ", p, played);
      (BaseReactPlayer)(videoRef.current).seekTo(p);
      setPlayed(p);
    }
  }

  // support keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === " ") {
        setIsPlaying(!isPlaying);
      }
      if (e.key === "[") {
        if (prevEpisode) {
          prevEpisode();
        }
      }
      if (e.key === "]") {
        if (nextEpisode) {
          nextEpisode();
        }
      }
      if (e.key === "ArrowLeft") {
        // seek back 10 seconds
        if ("seekTo" in videoRef?.current) {
          (BaseReactPlayer)(videoRef.current).seekTo(Math.max(played - 5 / duration, 0));
        }
      }
      if (e.key === "ArrowRight") {
        // todo next episode
        // seek forward 10 seconds
        if ("seekTo" in videoRef?.current) {
          (BaseReactPlayer)(videoRef.current).seekTo(Math.min(played + 5 / duration, 1));
        }
      }
      if (e.key === "ArrowUp") {
        setVolume(Math.min(volume + 0.1, 1));
      }
      if (e.key === "ArrowDown") {
        const p = Math.max(volume - 0.1, 0);
        if (p < 0.001) {
          setIsMuted(true);
        }
        setVolume(p);
      }
      if (e.key === "m") {
        setIsMuted(!isMuted);
      }
      if (e.key === "d") {
        setShowDanmaku(!showDanmaku);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    }
  }, [isPlaying, played, volume, isMuted, showDanmaku, nextEpisode, prevEpisode, videoRef]);

  // video player controls using tailwindcss
  return (
    //@ts-ignore
    <animated.div style={controlsAnimation}>
      {/* controls with linear gradient background  */}
      <div
        className={"absolute w-full pt-5 bottom-0 left-0 right-0 flex flex-col items-center justify-center select-none bg-gradient-to-t from-black to-transparent"}>
        {/* progress bar */}
        <div className={"flex flex-row items-center justify-center w-full h-5"}>
          {/* current time */}
          <div className={"mx-2"}><FormattedTime timeInSecond={duration * played}/></div>
          {/* progress bar */}
          <div ref={progressRef}
               className={"flex-grow flex flex-row relative cursor-pointer justify-center items-center h-5"}
               onClick={(e) => onSeekingClick(e)}
               onMouseEnter={() => setShowMark(true)}
               onMouseMove={(e) => {
                 if (showMark) {
                   const p = setProgress(e);
                   if (p !== undefined) {
                     setLocalProgress(p);
                   }
                 }
               }}
               onMouseLeave={() => setShowMark(false)}
          >
            {/* progress bar track */}
            <div className={"bg-slate-800/50 relative h-1 w-full"}>
              <div
                className={"h-1 bg-pink-400"}
                style={{
                  width: `${played * 100}%`,
                }}
              ></div>
            </div>
            {/* progress bar handle */}
            {showMark && <div
                className={"absolute border-slate-700 top-1/2 transform -translate-y-1/2  -translate-x-1/2  w-5 h-5 shadow-md flex flex-row items-center justify-center"}
                style={{
                  left: `${played * 100}%`,
                }}>
                <i className='bx bxs-dice-2'></i>
            </div>}
            {/*  progress bar marker */}
            {showMark && <div
                className={"absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 shadow-lg flex flex-row items-center justify-center"}
                style={{
                  left: `${localProgress * 100}%`,
                }}
            >
                <i className='bx bx-collapse-vertical'></i>
              {/* tooltip that display time at this point */}
                <div className={"absolute -top-10 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-2 py-1 rounded-md shadow-md"}>
                    <FormattedTime timeInSecond={duration * localProgress}/>
                </div>

            </div>
            }
          </div>
          {/* total time */}
          <div className={"mx-2"}><FormattedTime timeInSecond={duration}/></div>
        </div>

        {/* control bar */}
        <div className={"flex flex-row items-center justify-start w-full py-4"}>
          {/* play/pause button */}
          <button className={"mx-2"} onClick={() => setIsPlaying(!isPlaying)}>
            <i className={`${isPlaying ? "bx bx-pause" : "bx bx-play"} bx-lg`}></i>
          </button>
          {/* prev episode button */}
          <button className={"mx-2"} onClick={() => {
          }}>
            <i className={"bx bx-rewind bx-lg"}></i>
          </button>
          {/* next episode button */}
          <button className={"mx-2"} onClick={() => {
          }}>
            <i className={"bx bx-fast-forward bx-lg"}></i>
          </button>

          {/* volume button */}
          <div className={"group transform-all duration-200 flex flex-row items-center justify-center h-full"}>
            <button className={"mx-2 flex items-center justify-center"} onClick={() => setIsMuted(!isMuted)}>
              <i className={`${isMuted ? "bx bxs-volume-mute" : "bx bxs-volume-full"} bx-sm`}></i>
            </button>
            <div
              className={"inline-block group-hover:w-40 w-0 transform-all duration-200 h-full flex flex-row items-center justify-center pr-8"}
              onClick={(e) => setVolumeProgress(e)}
              onMouseMove={(e) => seekingVolume && setVolumeProgress(e)}
              onMouseDown={(e) => {
                setSeekingVolume(true);
                setVolumeProgress(e);
              }}
              onMouseUp={(e) => {
                setSeekingVolume(false);
                setVolumeProgress(e);
              }}
              onMouseLeave={(e) => {
                if (seekingVolume) {
                  setSeekingVolume(false);
                  setVolumeProgress(e);
                }
              }}
            >
              <div className={"bg-slate-200 relative h-0.5 w-full transform-all duration-200"}>
                <div
                  className={"absolute group-hover:block hidden rounded-full bg-slate-100 top-1/2 transform -translate-y-1/2 w-5 h-5 shadow-md"}
                  style={{
                    left: `${isMuted ? 0 : volume * 100}%`,
                  }}></div>
              </div>
            </div>
            {/* volume text */}
            <div className={"group-hover:block hidden"}>{isMuted ? 0 : Math.round(volume * 100)}%</div>
          </div>
          <div className={"flex-1"}></div>

          {/* danmaku button */}
          <button className={"mx-2"} onClick={() => setShowDanmaku(!showDanmaku)}>
            <i className={`${showDanmaku ? "bx bxs-comment-detail" : "bx bxs-comment-x text-slate-400"} bx-sm`}></i>
          </button>


          {/* subtitle button */}
          <button className={"mx-2"} onClick={() => setSubtitle(subtitle)}>
            <i className={`${subtitle ? "bx bxs-captions" : "bx bx-captions text-slate-400"} bx-md`}></i>
          </button>
          {/* picture in picture button */}
          <button className={"mx-2"} onClick={() => setPip(!pip)}>
            <i className={`${pip ? "bx bxs-copy" : "bx bx-copy"} bx-md`}></i>
          </button>
          {/*/!* playback speed button *!/*/}
          {/*<button className={"mx-2 text-md"} onClick={() => setSpeed(speed)}>*/}
          {/*  {speed}<i className={"bx bx-x"}></i>*/}
          {/*</button>*/}
          {/* fullscreen button */}
          <button className={"mx-2 flex-none"} onClick={setIsFullscreen}>
            <i className={`${isFullscreen ? "bx bx-exit-fullscreen" : "bx bx-fullscreen"} bx-md`}></i>
          </button>
        </div>
      </div>
    </animated.div>
  );
}
