/**
 * Quick gallery of all new UI primitives — Modal, Badge, Input, Select,
 * Tabs, Tooltip, Dropdown — to confirm they render correctly.
 */
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Trash2, Pencil, MoreHorizontal, Search, Mail } from "lucide-react";

import { Modal }    from "../modal";
import { Badge }    from "../badge";
import { Input }    from "../input";
import { Select }   from "../select";
import { Tabs, TabsList, Tab, TabPanel } from "../tabs";
import { Tooltip }  from "../tooltip";
import { Dropdown } from "../dropdown";
import { Button }   from "../button";

const meta: Meta = {
  title: "UI / Primitives Gallery",
  tags:  ["autodocs"],
};
export default meta;

// ── Modal ──────────────────────────────────────────────────────
export const ModalStory: StoryObj = {
  name: "Modal",
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Add an artist"
          description="Enter the artist details below."
          footer={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => setOpen(false)}>Add Artist</Button>
            </>
          }
        >
          <Input label="Artist name" placeholder="e.g. PJ Star" />
          <div className="mt-4">
            <Input label="Genre" placeholder="e.g. Amapiano" />
          </div>
        </Modal>
      </>
    );
  },
};

// ── Badge ──────────────────────────────────────────────────────
export const BadgeStory: StoryObj = {
  name: "Badge",
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="brand">Pro</Badge>
      <Badge variant="success">Active</Badge>
      <Badge variant="error">Overdue</Badge>
      <Badge variant="warning">Pending</Badge>
      <Badge variant="info">New</Badge>
      <Badge variant="outline">Draft</Badge>
    </div>
  ),
};

// ── Input ──────────────────────────────────────────────────────
export const InputStory: StoryObj = {
  name: "Input",
  render: () => (
    <div className="flex flex-col gap-4 max-w-sm">
      <Input label="Artist name" placeholder="e.g. PJ Star" />
      <Input label="Email" type="email" placeholder="artist@label.com" leadingIcon={<Mail size={14} />} />
      <Input placeholder="Search artists…" leadingIcon={<Search size={14} />} withWrapper={false} />
      <Input label="With error" error="This field is required" placeholder="…" />
      <Input label="With hint" hint="Used for booking confirmations" placeholder="Contact name" />
    </div>
  ),
};

// ── Select ─────────────────────────────────────────────────────
export const SelectStory: StoryObj = {
  name: "Select",
  render: () => (
    <div className="flex flex-col gap-4 max-w-sm">
      <Select label="Plan" placeholder="Choose a plan…">
        <option value="free">Free</option>
        <option value="pro">Pro</option>
        <option value="agency">Agency</option>
        <option value="enterprise">Enterprise</option>
      </Select>
      <Select label="With error" error="Please select a tier">
        <option value="">—</option>
      </Select>
    </div>
  ),
};

// ── Tabs ───────────────────────────────────────────────────────
export const TabsStory: StoryObj = {
  name: "Tabs",
  render: () => {
    const [tab, setTab] = useState("contacts");
    return (
      <Tabs value={tab} onChange={setTab}>
        <TabsList>
          <Tab value="contacts">Contacts</Tab>
          <Tab value="import">Import CSV</Tab>
          <Tab value="segments">Segments</Tab>
        </TabsList>
        <TabPanel value="contacts" active={tab === "contacts"}>
          <p className="text-text-muted text-sm">Contacts panel content.</p>
        </TabPanel>
        <TabPanel value="import" active={tab === "import"}>
          <p className="text-text-muted text-sm">Import CSV panel content.</p>
        </TabPanel>
        <TabPanel value="segments" active={tab === "segments"}>
          <p className="text-text-muted text-sm">Segments panel content.</p>
        </TabPanel>
      </Tabs>
    );
  },
};

// ── Tooltip ────────────────────────────────────────────────────
export const TooltipStory: StoryObj = {
  name: "Tooltip",
  render: () => (
    <div className="flex gap-6 pt-8">
      <Tooltip content="Delete artist" side="top">
        <Button variant="ghost" size="sm"><Trash2 size={14} /></Button>
      </Tooltip>
      <Tooltip content="Edit details" side="bottom">
        <Button variant="ghost" size="sm"><Pencil size={14} /></Button>
      </Tooltip>
      <Tooltip content="More actions available" side="right">
        <Button variant="outline" size="sm">Hover me</Button>
      </Tooltip>
    </div>
  ),
};

// ── Dropdown ───────────────────────────────────────────────────
export const DropdownStory: StoryObj = {
  name: "Dropdown",
  render: () => (
    <div className="pt-4">
      <Dropdown
        trigger={
          <Button variant="ghost" size="sm">
            <MoreHorizontal size={16} />
          </Button>
        }
        items={[
          { label: "Edit artist",    icon: <Pencil size={13} />, onClick: () => {} },
          { label: "View scorecard", icon: <Search size={13} />, onClick: () => {} },
          { label: "Delete",         icon: <Trash2 size={13} />, onClick: () => {}, danger: true, dividerBefore: true },
        ]}
      />
    </div>
  ),
};
