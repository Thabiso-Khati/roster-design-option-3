import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../button";

/**
 * The ROSTER primary interactive element.
 * Supports four variants and three sizes with a built-in loading state.
 */
const meta: Meta<typeof Button> = {
  title:     "UI / Button",
  component:  Button,
  tags:      ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Core button primitive used throughout ROSTER. Uses the gold-gradient for primary actions, outline for secondary, ghost for tertiary, and danger for destructive actions.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "outline", "ghost", "danger"],
      description: "Visual style of the button",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Padding and font-size scale",
    },
    loading: {
      control: "boolean",
      description: "Shows a spinner and disables interaction",
    },
    disabled: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// ── Stories ────────────────────────────────────────────────────

export const Primary: Story = {
  args: { children: "Add Artist", variant: "primary", size: "md" },
};

export const Outline: Story = {
  args: { children: "View Details", variant: "outline", size: "md" },
};

export const Ghost: Story = {
  args: { children: "Cancel", variant: "ghost", size: "md" },
};

export const Danger: Story = {
  args: { children: "Delete", variant: "danger", size: "md" },
};

export const Small: Story = {
  args: { children: "Export CSV", variant: "primary", size: "sm" },
};

export const Large: Story = {
  args: { children: "Get Started", variant: "primary", size: "lg" },
};

export const Loading: Story = {
  args: { children: "Saving…", variant: "primary", size: "md", loading: true },
};

export const Disabled: Story = {
  args: { children: "Unavailable", variant: "primary", size: "md", disabled: true },
};

/** All variants at a glance */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};

/** All sizes at a glance */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
