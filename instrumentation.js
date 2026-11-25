import { SeverityNumber } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

export let loggerProvider = null;
export let orderLogger = null;
export { SeverityNumber };

if (token && host) {
  loggerProvider = new LoggerProvider({
    resource: resourceFromAttributes({
      "service.name": "redstone-online-ordering",
    }),
    processors: [
      new BatchLogRecordProcessor(
        new OTLPLogExporter({
          url: `${host.replace(/\/$/, "")}/i/v1/logs`,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      ),
    ],
  });
  orderLogger = loggerProvider.getLogger("redstone.order-lifecycle");
} else if (process.env.NODE_ENV !== "production") {
  if (!token) {
    console.warn(
      "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured"
    );
  }
  if (!host) {
    console.warn(
      "NEXT_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_HOST is configured"
    );
  }
}

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && loggerProvider) {
    const shutdown = () => {
      loggerProvider.shutdown().catch(() => {});
    };

    process.once("SIGTERM", shutdown);
    process.once("SIGINT", shutdown);
  }
}
