import type { Meta, StoryObj } from "@storybook/react";
import { ThemeToggle } from "../theme-toggle";
import { ThemeProvider } from "@/context/theme-context";

const meta: Meta<typeof ThemeToggle> = {
  title:     "UI / ThemeToggle",
  component:  ThemeToggle,
  tags:      ["autodocs"],
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Compact icon button that cycles dark → light → system. Reads and writes from `ThemeProvider` context. Shows the current mode as an icon with a tooltip.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ThemeToggle>;

export const Default: Story = {};

export const InSidebarFooter: Story = {
  render: () => (
    <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3 w-fit">
      <span className="text-text-muted text-sm">Theme</span>
      <ThemeToggle />
    </div>
  ),
};
