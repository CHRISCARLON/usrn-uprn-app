import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("@duckdb/node-api", "@duckdb/node-bindings");
    }
    return config;
  },
};

export default nextConfig;
