import { useEffect, useState } from "react";
import type { HealthResponse } from "../types/health";
import { pickLatestHeartRate, formatJstTime } from "../lib/heartRate";
import styles from "./HeartRate.module.scss";

const HEALTH_API_URL = "https://api.nenex.me/health";
const ALIVE_URL = "https://alive.nenex.me";

type State = { status: "loading" } | { status: "ok"; heartRate: number; measuredAt: string | null } | { status: "unavailable" };

/**
 * 現在の心拍数を実行時fetchで表示する React island（client:visible）。
 * alive.nenex.me への導線はSSR時点のJSXに常に含まれるため、fetch成否に関わらず静的HTMLに残る。
 */
export default function HeartRate() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    fetch(HEALTH_API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`health API request failed: ${res.status}`);
        return res.json() as Promise<HealthResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        const picked = pickLatestHeartRate(data);
        if (picked.status === "ok") {
          setState({
            status: "ok",
            heartRate: picked.heartRate,
            measuredAt: picked.isFallback ? formatJstTime(picked.recordedAt) : null,
          });
        } else {
          setState({ status: "unavailable" });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: "unavailable" });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.pill}>
      <span className={styles.icon} aria-hidden="true">
        ♥
      </span>
      <span className={styles.value} aria-live="polite">
        {state.status === "loading" && "…"}
        {state.status === "ok" && (
          <>
            {state.heartRate}
            <span className={styles.unit}>bpm</span>
            {state.measuredAt && <span className={styles.measuredAt}>（{state.measuredAt}時点）</span>}
          </>
        )}
        {state.status === "unavailable" && <span className={styles.unavailable}>取得できませんでした</span>}
      </span>
      <a className={styles.link} href={ALIVE_URL} target="_blank" rel="noopener noreferrer">
        alive.nenex.me →
      </a>
    </div>
  );
}
