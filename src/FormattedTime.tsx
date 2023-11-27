interface FormattedTimeProps {
  timeInSecond: number;
  className?: string;
}

const formatTime = (timeInSecond: number) => {
  const date = new Date(timeInSecond * 1000);
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const hours = date.getUTCHours();
  return `${hours ? hours + ':' : ''}${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

export default function FormattedTime({timeInSecond, className}: FormattedTimeProps) {
  return (
    <time dateTime={`P${Math.round(timeInSecond)}S`} className={className}>
      {formatTime(timeInSecond)}
    </time>
  )
}
