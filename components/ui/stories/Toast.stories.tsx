import type { Meta, StoryObj } from "@storybook/react";
import { ToastProvider, useToast } from "../toast";
import { Button } from "../button";

const meta: Meta = {
  title:     "UI / Toast",
  tags:      ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Notification toast system. Wrap your app with `ToastProvider` and trigger toasts via the `useToast()` hook. Supports `success`, `error`, `warning`, and `info` types. Auto-dismisses after 4 seconds.",
      },
    },
  },
};

export default meta;

function ToastDemo({ type }: { type: "success" | "error" | "warning" | "info" }) {
  const toast = useToast();
  const messages: Record<string, string> = {
    success: "Artist added successfully",
    error:   "Failed to save changes",
    warning: "Your plan limit is almost reached",
    info:    "Stats refresh scheduled for 03:00 UTC",
  };
  return (
    <Button variant="outline" onClick={() => toast(messages[type], type)}>
      Show {type} toast
    </Button>
  );
}

export const Success: StoryObj = {
  render: () => (
    <ToastProvider>
      <ToastDemo type="success" />
    </ToastProvider>
  ),
};

export const Error: StoryObj = {
  render: () => (
    <ToastProvider>
      <ToastDemo type="error" />
    </ToastProvider>
  ),
};

export const Warning: StoryObj = {
  render: () => (
    <ToastProvider>
      <ToastDemo type="warning" />
    </ToastProvider>
  ),
};

export const Info: StoryObj = {
  render: () => (
    <ToastProvider>
      <ToastDemo type="info" />
    </ToastProvider>
  ),
};

function AllTypesDemo() {
  const toast = useToast();
  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => toast("Artist saved", "success")}>Success</Button>
      <Button variant="danger" onClick={() => toast("Import failed", "error")}>Error</Button>
      <Button variant="outline" onClick={() => toast("Approaching limit", "warning")}>Warning</Button>
      <Button variant="ghost" onClick={() => toast("Sync complete", "info")}>Info</Button>
    </div>
  );
}

export const AllTypes: StoryObj = {
  render: () => (
    <ToastProvider>
      <AllTypesDemo />
    </ToastProvider>
  ),
};
