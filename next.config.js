const path = require("path");

const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  // "Coming Soon" pages hidden for launch: their addresses go to the menu
  // (temporary redirects, so they can come back later). Remove a line here,
  // and put its link back in components/Header.js, when a page is finished.
  async redirects() {
    return [
      { source: "/rewards", destination: "/menu", permanent: false },
      { source: "/tracker", destination: "/menu", permanent: false },
      { source: "/pizza-calculator", destination: "/menu", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        // Stripe's card form (its own frame on js.stripe.com) loads our
        // Red Stone Display font, which needs this to be allowed.
        source: "/fonts/:path*",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // frame-ancestors is the modern replacement for X-Frame-Options and
          // covers /kitchen-login (a shared-password form) against clickjacking.
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
    ];
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};

module.exports = nextConfig;
