import { useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import posthog from "posthog-js";
import { auth } from "../utils/firebaseConfig";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

if (token) {
  posthog.init(token, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2026-08-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  });
} else if (process.env.NODE_ENV === "development") {
  console.error(
    new Error(
      "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured"
    )
  );
}

export default function PostHogInit() {
  const identifiedUserIdRef = useRef(null);
  const identifiedUserWasAnonymousRef = useRef(false);

  useEffect(() => {
    if (!token) return;

    return onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (identifiedUserIdRef.current) {
          posthog.reset();
          identifiedUserIdRef.current = null;
          identifiedUserWasAnonymousRef.current = false;
        }
        return;
      }

      if (
        identifiedUserIdRef.current &&
        identifiedUserIdRef.current !== user.uid &&
        !identifiedUserWasAnonymousRef.current
      ) {
        posthog.reset();
      }

      const personProperties = {
        auth_type: user.isAnonymous ? "anonymous" : "staff",
      };
      if (user.email) personProperties.email = user.email;

      posthog.identify(user.uid, personProperties);
      identifiedUserIdRef.current = user.uid;
      identifiedUserWasAnonymousRef.current = user.isAnonymous;
    });
  }, []);

  return null;
}
