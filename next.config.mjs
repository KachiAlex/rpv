/** @type {import('next').NextConfig} */
// Static export only for the desktop (Electron) build — the production VPS
// build must keep API routes, so export requires DESKTOP_BUILD=1. Every
// setting the desktop needs is gated so this file stays inert if it is ever
// deployed to the server.
const isDesktopBuild = process.env.DESKTOP_BUILD === '1';

const nextConfig = {
  ...(isDesktopBuild
    ? { output: 'export', trailingSlash: true }
    : {}),
  images: {
    unoptimized: true,
  },
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
