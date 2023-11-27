/**
 * Definition of the danmaku object
 * @param cid: danmaku id
 * @param p: params for danmaku, with format: `time,mode,color,userId`.
 *           time: time in seconds with 2 valid digits after the decimal point, e.g. `12.34`
 *           mode: 1 for normal, 4 for bottom, 5 for top
 *           color: color in 32bit integer, R*256*256 + G*256 + B, where R, G, B are in range [0, 255]
 *           userId: user id is number in string
 */
export type RawDanmaku = {
  cid: number;
  p: string;
  m: string;
}

export type Danmaku = {
  cid: number;
  time: number;
  mode: number;
  color: number;
  userId: string;
  text: string;
}

export function parseDanmaku(rawDanmaku: RawDanmaku): Danmaku {
  const [time, mode, color, userId] = rawDanmaku.p.split(',');
  return {
    cid: rawDanmaku.cid,
    time: parseFloat(time),
    mode: parseInt(mode),
    color: parseInt(color),
    userId,
    text: rawDanmaku.m,
  };
}
