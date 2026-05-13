import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
  stories: [
    "../components/**/*.stories.@(ts|tsx)",
    "../stories/**/*.stories.@(ts|tsx)",
  ],

  addons: [
    "@storybook/addon-essentials",   // controls, actions, docs, viewport, backgrounds
    "@storybook/addon-interactions", // play functions + step-by-step testing
    "@storybook/addon-a11y",         // accessibility audit panel
  ],

  framework: {
    name: "@storybook/nextjs",
    options: {},
  },

  // Make Next.js static assets (fonts, images) work inside Storybook
  staticDirs: ["../public"],

  docs: {
    autodocs: "tag",
  },

  typescript: {
    check: false,
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },
};

export default config;
