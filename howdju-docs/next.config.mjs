import nextra from "nextra";
import remarkSmartypants from "remark-smartypants";

const withNextra = nextra({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.jsx",

  mdxOptions: {
    remarkPlugins: [remarkSmartypants],
  },
});

export default withNextra({
  webpack(config, options) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  // TODO(#570) consider optimizing images using a service
  images: { unoptimized: true },
});
