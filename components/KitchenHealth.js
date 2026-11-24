// components/KitchenHealth.js
//
// Safety alerts for the kitchen screen: anything that could stop new orders
// from showing up (or being heard) gets a banner at the top of the screen.
// Red = orders may be missed right now; amber = fix soon.
//
//   - No internet (wifi dropped)                       red
//   - Online, but not connected to the order server    red (after 20s)
//   - The orders feed reported an error                red
//   - Battery under 20% and not charging               amber (red under 10%)
//   - Order sound is off / blocked by the browser      amber
//   - Screen can't be kept awake (it may sleep)        amber
//   - The device was asleep for a while                amber, until dismissed
//
// While anything red is showing, a warning tone plays every 30 seconds (if
// the order sound has been turned on), so it gets noticed from across the
// kitchen. Battery level isn't available on iPhone/iPad Safari, so that
// check only works on Android tablets / Chrome; the banner says so once.
import { useEffect, useRef, useState } from "react";

const SERVER_GRACE_MS = 20000; // how long "not connected" may last before alerting
const SLEEP_GAP_MS = 60000; // a timer late by this much means the device slept

export default function KitchenHealth({ ordersError, fromCacheSince, alertsEnabled, audioCtxRef, onEnableAlerts }) {
  const [online, setOnline] = useState(true);
  const [battery, setBattery] = useState(null); // { level, charging } or "unsupported"
  const [wakeLock, setWakeLock] = useState("pending"); // "on" | "unsupported" | "failed"
  const [audioState, setAudioState] = useState(null);
  const [sleptFor, setSleptFor] = useState(0); // ms the device was asleep
  const [now, setNow] = useState(() => Date.now());

  // ---- wifi ----
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // ---- battery (Chrome / Android only) ----
  useEffect(() => {
    let bat = null;
    const read = () => bat && setBattery({ level: bat.level, charging: bat.charging });
    if (!navigator.getBattery) {
      setBattery("unsupported");
      return undefined;
    }
    navigator
      .getBattery()
      .then((b) => {
        bat = b;
        read();
        b.addEventListener("levelchange", read);
        b.addEventListener("chargingchange", read);
      })
      .catch(() => setBattery("unsupported"));
    return () => {
      if (bat) {
        bat.removeEventListener("levelchange", read);
        bat.removeEventListener("chargingchange", read);
      }
    };
  }, []);

  // ---- keep the screen awake (re-asked every time the page is shown) ----
  useEffect(() => {
    let lock = null;
    const ask = async () => {
      if (!("wakeLock" in navigator)) {
        setWakeLock("unsupported");
        return;
      }
      if (document.visibilityState !== "visible") return;
      try {
        lock = await navigator.wakeLock.request("screen");
        setWakeLock("on");
        lock.addEventListener("release", () => setWakeLock((w) => (w === "on" ? "failed" : w)));
      } catch {
        setWakeLock("failed");
      }
    };
    ask();
    const onVis = () => document.visibilityState === "visible" && ask();
    document.addEventListener("visibilitychange", onVis);
    // browsers may only grant it after a tap: try again on the next tap
    document.addEventListener("pointerdown", ask, { once: true });
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("pointerdown", ask);
      lock?.release?.().catch(() => {});
    };
  }, []);

  // ---- a clock tick: notices sleep, refreshes the sound state ----
  const lastTickRef = useRef(Date.now());
  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      const gap = t - lastTickRef.current;
      if (gap > SLEEP_GAP_MS) setSleptFor(gap);
      lastTickRef.current = t;
      setNow(t);
      setAudioState(audioCtxRef.current?.state || null);
    }, 5000);
    return () => clearInterval(id);
  }, [audioCtxRef]);

  // ---- what's wrong right now ----
  const issues = [];
  if (!online) {
    issues.push({ level: "red", text: "No internet connection. New orders won't arrive until the wifi is back." });
  } else if (fromCacheSince && now - fromCacheSince > SERVER_GRACE_MS) {
    issues.push({
      level: "red",
      text: "Can't reach the order server. New orders may not be showing. Check the wifi, or reload the page.",
    });
  }
  if (ordersError) {
    issues.push({ level: "red", text: `The order feed stopped (${ordersError}). Reload the page.` });
  }
  if (battery && battery !== "unsupported" && !battery.charging && battery.level < 0.2) {
    issues.push({
      level: battery.level < 0.1 ? "red" : "amber",
      text: `Battery is at ${Math.round(battery.level * 100)}%. Plug the device in.`,
    });
  }
  if (!alertsEnabled) {
    issues.push({ level: "amber", text: "Order sound is off.", action: { label: "Turn On Sound", onClick: onEnableAlerts } });
  } else if (audioState && audioState !== "running") {
    issues.push({
      level: "amber",
      text: "The browser paused the order sound.",
      action: { label: "Tap to Turn Back On", onClick: onEnableAlerts },
    });
  }
  if (wakeLock === "unsupported" || wakeLock === "failed") {
    issues.push({
      level: "amber",
      text: "This screen may turn off by itself. Set the device's Auto-Lock / Screen timeout to Never.",
    });
  }
  if (sleptFor) {
    issues.push({
      level: "amber",
      text: `The device was asleep for about ${Math.max(1, Math.round(sleptFor / 60000))} min. Check that no orders were missed.`,
      action: { label: "OK", onClick: () => setSleptFor(0) },
    });
  }
  const hasRed = issues.some((i) => i.level === "red");

  // ---- warning tone every 30s while something red is showing ----
  useEffect(() => {
    if (!hasRed || !alertsEnabled) return undefined;
    const beep = () => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const t = ctx.currentTime;
      [440, 330, 440, 330].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.0001, t + i * 0.25);
        gain.gain.exponentialRampToValueAtTime(0.15, t + i * 0.25 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.25 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + i * 0.25);
        osc.stop(t + i * 0.25 + 0.24);
      });
    };
    beep();
    const id = setInterval(beep, 30000);
    return () => clearInterval(id);
  }, [hasRed, alertsEnabled, audioCtxRef]);

  if (!issues.length) {
    return (
      <div className="kh kh--ok" role="status">
        ✓ Connected. Orders are coming in live.
        {battery && battery !== "unsupported" && ` Battery ${Math.round(battery.level * 100)}%${battery.charging ? " (charging)" : ""}.`}
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="kh" role="alert">
      {issues.map((i, n) => (
        <div key={n} className={`kh-row kh-row--${i.level}`}>
          <span className="kh-icon" aria-hidden="true">{i.level === "red" ? "⛔" : "⚠️"}</span>
          <span className="kh-text">{i.text}</span>
          {i.action && (
            <button type="button" className="kh-btn" onClick={i.action.onClick}>
              {i.action.label}
            </button>
          )}
        </div>
      ))}
      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .kh {
    font-family: var(--font-plain);
    margin: 0 0 12px;
  }
  .kh--ok {
    padding: 8px 14px;
    border-radius: 8px;
    background: #e8f5e9;
    color: #1b5e20;
    font-size: 15px;
    font-weight: 600;
  }
  .kh-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    margin-bottom: 6px;
    border-radius: 8px;
    font-size: 18px;
    font-weight: 700;
    line-height: 1.3;
  }
  .kh-row--red {
    background: #c62828;
    color: #fff;
    animation: kh-pulse 1.6s ease-in-out infinite;
  }
  .kh-row--amber {
    background: #ffe08a;
    color: #4a3200;
  }
  .kh-icon { font-size: 20px; }
  .kh-text { flex: 1 1 auto; }
  .kh-btn {
    flex: 0 0 auto;
    padding: 8px 14px;
    border: 0;
    border-radius: 6px;
    background: #111;
    color: #fff;
    font: inherit;
    font-size: 16px;
    cursor: pointer;
  }
  @keyframes kh-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.75; }
  }
`;
