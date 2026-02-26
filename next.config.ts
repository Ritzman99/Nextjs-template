import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  sassOptions: {
    // Use forward slashes so Sass resolves paths on all platforms (Turbopack may ignore includePaths)
    includePaths: [path.join(process.cwd(), "scss").replace(/\\/g, "/")],
  },
};

export default nextConfig;
