import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton, DashboardSkeleton, MasterclassSkeleton, ExpertSkeleton } from "../skeleton";

const meta: Meta<typeof Skeleton> = {
  title:     "UI / Skeleton",
  component:  Skeleton,
  tags:      ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Animated loading placeholder. Use `Skeleton` for custom shapes, or the pre-built page-level variants (`DashboardSkeleton`, `MasterclassSkeleton`, `ExpertSkeleton`) during data fetching.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: { className: "h-8 w-48" },
};

export const Circle: Story = {
  args: { className: "h-12 w-12 rounded-full" },
};

export const Text: Story = {
  render: () => (
    <div className="space-y-2 w-64">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  ),
};

export const Card: Story = {
  render: () => (
    <div className="bg-surface border border-border rounded-xl p-5 w-72 space-y-3">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-3 w-full" />
    </div>
  ),
};

export const Dashboard: Story = {
  render: () => <DashboardSkeleton />,
  parameters: { layout: "padded" },
};

export const Masterclass: Story = {
  render: () => <MasterclassSkeleton />,
  parameters: { layout: "padded" },
};

export const Expert: Story = {
  render: () => <ExpertSkeleton />,
  parameters: { layout: "padded" },
};
