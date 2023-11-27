/**
 * render danmakus over video
 */
import {Danmaku} from "./api/danmaku";
import React, {useEffect, useRef, useState} from "react";
import {
  useAnimation,
  motion,
  AnimationDefinition,
  AnimatePresence,
  useMotionValue, AnimationPlaybackControls,
  animate, usePresence
} from "framer-motion";
import {motionValue} from "framer-motion/dom";


interface DanmakuRendererProps {
  danmakus: Danmaku[];
  isPlaying: boolean;
  duration: number;
  isFullScreen?: boolean;
  time: number;
  sad?: (danmakus: Danmaku[]) => void;
  sdps?: (dps: number) => void;
  config?: {
    area: "full" | "half" | "third" | "quarter";
    speed: number;
    style?: any
  };
}

interface CommentProps {
  danmaku: Danmaku;
  isPlaying: boolean;
  containerWidth: number;
  containerHeight: number;
  onComplete: (def: AnimationDefinition) => void;
  commentWidth?: number;
  commentHeight?: number;
  delay?: number;
}

const Comment = ({
                   danmaku,
                   isPlaying,
                   containerWidth,
                   containerHeight,
                   onComplete,
                   commentWidth,
                   commentHeight,
                   delay
                 }: CommentProps) => {
  const controls = useAnimation();
  const scaleX = motionValue(0);
  // const t = animate(scaleX, 1, {
  //   duration: 20,
  // })
  const [animation, setAnimation] = useState<any>(null);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const danmakuRef = useRef<HTMLDivElement | null>(null);
  const [x, setX] = useState<number>(0);
  const [y, setY] = useState<number>(0);
  const [calculated, setCalculated] = useState<boolean>(false);
  const [isPresent, safeToRemove] = usePresence();
  useEffect(() => {
    // console.log("danmaku width", danmakuWidth, containerWidth, -containerWidth / danmakuWidth * 100.0);
    const w = commentWidth || (13 * danmaku.text.length);
    const h = commentHeight || 24;
    setX(-(containerWidth / w * 100.0 + 200.0));
    setY(containerHeight / h * 100.0 * Math.random());
    // console.log("set x", x, y, containerWidth, containerHeight, w, h)
    setCalculated(true);
    scaleX.set(-x);
  }, [containerWidth, commentWidth, containerHeight]);
  useEffect(() => {
    if (calculated && !animation) {
      // @ts-ignore
      const a = animate(danmakuRef.current, {
        x: [`${-x}%`, `${x}%`],
        y: [`${y}%`, `${y}%`]
      }, {
        duration: 30,
        transition: {
          delay: delay || 0,
        }
      })
      if (!isPlaying)
        a.pause();
      setAnimation(a);
    }
  }, [danmakuRef.current, calculated]);
  // useEffect(() => {
  //   if (calculated && animation) {
  //     setTimeout(safeToRemove, 1);
  //   }
  // },[x, y]);
  useEffect(() => {
    if (isPlaying) {
      if (animation)
        animation.play();
      // if (controls)
      //   controls.start({x: `${x}%`})
    } else {
      if (animation)
        animation.pause();
      // if (controls)
      // controls.stio();
    }

  }, [isPlaying]);

  return (
    <AnimatePresence>
      {/*{calculated && (<motion.div*/}
      {/*  ref={danmakuRef}*/}
      {/*  initial={{x: `${-x}%`, y: Math.random() * y + "%", position: "absolute"}}*/}
      {/*  animate={controls}*/}
      {/*  transition={{*/}
      {/*    duration: 20,*/}
      {/*    delay: delay || 0,*/}
      {/*  }}*/}
      {/*  className={"absolute text-2xl shadow-lg"}*/}
      {/*  onAnimationComplete={() => {*/}
      {/*    console.log("onAnimationComplete");*/}
      {/*    // setIsVisible(false);*/}
      {/*  }}*/}
      {/*>*/}
      {/*  <span className="text-white">{danmaku.text}</span>*/}
      {/*</motion.div>)}*/}
      {calculated && (<div
        ref={danmakuRef}
        className={"absolute text-2xl text-shadow"}
        style={{
          transform: `translateX(${-x}%) translateY(${y}%)`,
        }}
      >
        <span className="text-white">{danmaku.text}</span>
      </div>)}
    </AnimatePresence>);
}


export default function DanmakuRenderer({
                                          danmakus,
                                          isPlaying,
                                          time,
                                          sad,
                                          sdps,
                                          duration,
                                          config
                                        }: DanmakuRendererProps) {
  // render danmakus over video, animate danmaku from right to left with css at danmaku.timestamp
  const danmakuStyle = {
    position: "absolute",
    right: 0,
    top: 0,
    color: "white",
    fontSize: "1.5rem",
    textShadow: "0 0 1rem black",
  }
  const sortedDanmakus = danmakus.sort((a, b) => a.time - b.time);
  const [danmakuLoaded, setDanmakuLoaded] = useState<boolean>(false);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasContext, setCanvasContext] = useState<CanvasRenderingContext2D | null>(null);
  const BIN_WIDTH = 1;
  const [danmakuPerSecond, setDanmakuPerSecond] = useState<number>(-1);
  const {area, speed} = config || {area: "full", speed: 1};


  useEffect(() => {
    const ctx = document.createElement("canvas").getContext("2d");
    ctx!.font = "1rem sans-serif";
    setCanvasContext(ctx);
  }, []);

  const setWHDPS = () => {
    const w = containerRef.current!.clientWidth;
    setContainerWidth(w);
    const h = containerRef.current!.clientHeight * {
      "full": 1,
      "half": 0.5,
      "third": 0.33,
      "quarter": 0.25,
    }[area]
    setContainerHeight(h);
    setDanmakuPerSecond(Math.max(1, Math.ceil(0.5 * w / 1920 * h / 30 * speed)));
  }
  useEffect(() => {
    console.log("resize danmaku renderer container called", containerWidth, containerHeight);
    if (containerRef.current) {
      setWHDPS();
      // console.log("resize danmaku renderer container set",containerRef, containerRef.current.clientWidth, containerRef.current.clientHeight);
    }
    // update on resize event
    const handleResize = () => {
      if (containerRef.current) {
        console.log("resize container:", containerRef.current.clientWidth, containerRef.current.clientHeight);
        setWHDPS();
        // setActiveDanmaku((prevState) => [...prevState]);
      }
    }
    window.addEventListener("resize", handleResize);
  }, [containerRef, area]);
  // dispatch danmaku into bins that interval is 5 second
  const [bins, setBins] = useState<Danmaku[][]>([]);
  const calculateBins = () => {
    // get integer bin count
    const binCount = Math.ceil(duration / BIN_WIDTH);
    const newBins: Danmaku[][] = new Array(binCount).fill([]).map(() => []);
    let binIndex = 0;
    for (const danmaku in sortedDanmakus) {
      // todo: optimize this
      if (sortedDanmakus[danmaku].time >= duration) {
        // console.log("danmaku time > duration");
        break;
      }
      binIndex = Math.floor(sortedDanmakus[danmaku].time / BIN_WIDTH);
      if (newBins[binIndex] === undefined) {
        console.log("binIndex out of range", binIndex);
        break;
      }
      // console.log(`push danmaku to bin ${binIndex}, time is ${sortedDanmakus[danmaku].time}`);
      // todo limit danmaku count in each bin
      if (newBins[binIndex].length < danmakuPerSecond)
        newBins[binIndex].push(sortedDanmakus[danmaku]);
    }
    return newBins;
  }
  useEffect(() => {
    console.log("called dispatch bins");
    if (duration === 0 || sortedDanmakus.length === 0) {
      console.log("duration is 0")
      return;
    }
    // console.log(`duration: ${duration}, build bins: ${binCount}`);
    if (bins && bins.length > 0) {
      console.log("already have bins, dps", bins[0]?.length);
      return;
    }
    if (danmakuPerSecond <= 0) {
      console.log("danmaku per second <= 0");
      return;
    }
    console.log("calculating bins in first dispatching");
    const newBins = calculateBins();
    // console.log("bins", newBins)
    setDanmakuLoaded(true);
    setBins(newBins);
  }, [duration, sortedDanmakus]);

  useEffect(() => {
    if (sdps) sdps(danmakuPerSecond);
    console.log("danmaku per second", danmakuPerSecond);
    if (duration && sortedDanmakus && bins && (danmakuPerSecond > 0)) {
      const newBins = calculateBins();
      setBins(newBins);
      console.log(`calculating bins in update dps ${bins.length}`);
    }
  }, [danmakuPerSecond]);

  const [activeBinIndex, setActiveBinIndex] = useState<number>(0);
  useEffect(() => {
    if (time) {
      const binIndex = Math.floor(time / BIN_WIDTH);
      if (binIndex !== activeBinIndex)
        setActiveBinIndex(binIndex);
    }
  }, [time]);
  const [activeDanmaku, setActiveDanmaku] = useState<Danmaku[]>([]);

  useEffect(() => {
    if (sad && danmakuLoaded) {
      // console.log("current binIndex", activeBinIndex, bins);
      setActiveDanmaku((prevState) => [...prevState.filter(
        (danmaku) => (time - danmaku.time) < 20
      ), ...bins[activeBinIndex]]);
      sad(activeDanmaku);
    }
  }, [danmakuLoaded, activeBinIndex]);

  const onComplete = (def: AnimationDefinition) => {
    // hide danmaku
    console.log("onComplete", def);
  }
  return (
    <div className={"absolute top-0 left-0 right-0 bottom-0 w-full h-full pointer-events-none overflow-hidden"}
         ref={containerRef}>
      {activeDanmaku.map((danmaku) => (
        <Comment key={danmaku.cid}
                 danmaku={danmaku}
                 isPlaying={isPlaying}
                 onComplete={onComplete}
                 containerWidth={containerWidth}
                 containerHeight={containerHeight}
                 commentWidth={canvasContext?.measureText(danmaku.text).width || 0}
                 delay={danmaku.time - time}
        />
      ))}
    </div>
  )
}
