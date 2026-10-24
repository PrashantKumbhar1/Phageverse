import { useEffect, useState } from "react";
const query =
  "(max-width: 760px), (max-width: 1024px) and (max-height: 500px) and (pointer: coarse)";
export function useMobileLayout() {
  const [mobile, Mobile] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query),
      change = () => Mobile(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  return mobile;
}
