/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  experimental: {
    // Keep native binaries (onnxruntime-node) and its host loader out of the
    // webpack bundle so paths resolve at runtime as normal Node requires.
    serverComponentsExternalPackages: [
      "@xenova/transformers",
      "onnxruntime-node",
      "sharp",
    ],
  },
};
