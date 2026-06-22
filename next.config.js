/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Tone.js ships ESM-only; transpiling it lets webpack process its source.
  transpilePackages: ["tone"],
  webpack: (config) => {
    // Tone's package.json "browser" field points at a UMD bundle whose named
    // exports (getTransport, etc.) webpack can't statically bind. Force the ESM
    // build so `import * as Tone from "tone"` resolves real named exports.
    config.resolve.alias = {
      ...config.resolve.alias,
      tone: require.resolve("tone/build/esm/index.js"),
    };
    return config;
  },
};

module.exports = nextConfig;
