import type { Preview } from "@storybook/react";
import "../app/globals.css";

const preview: Preview = {
  parameters: {
    // Default to dark theme (ROSTER's default)
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark",  value: "#080B14" },
        { name: "light", value: "#F4F6FB" },
      ],
    },

    // Show docs tab by default on all stories
    docs: {
      toc: true,
    },

    // Viewport presets matching ROSTER's responsive breakpoints
    viewport: {
      viewports: {
        mobile:  { name: "Mobile (375px)",  styles: { width: "375px",  height: "812px"  } },
        tablet:  { name: "Tablet (768px)",  styles: { width: "768px",  height: "1024px" } },
        desktop: { name: "Desktop (1440px)",styles: { width: "1440px", height: "900px"  } },
      },
      defaultViewport: "desktop",
    },

    // Accessibility: flag any violations as errors (not just warnings)
    a11y: {
      config: {
        rules: [{ id: "color-contrast", enabled: true }],
      },
    },

    controls: {
      matchers: {
        color: /(background|color)$/i,
        date:  /date$/i,
      },
    },
  },

  // Apply data-theme="dark" to the story wrapper so CSS vars resolve correctly
  decorators: [
    (Story) => {
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", "dark");
      }
      return Story();
    },
  ],
};

export default preview;
