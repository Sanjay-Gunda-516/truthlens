/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for the Docker multi-stage build to produce a minimal server bundle.
  // The Dockerfile copies .next/standalone + .next/static → ~120MB image.
  output: "standalone",

  // Allow images from any domain (safe for portfolio projects).
  images: { unoptimized: true },

  // Expose the API URL at build time as a public env var.
  // Falls back to localhost for local dev.
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  },
};

module.exports = nextConfig;
