"use client";
/**
 * Tabs — ROSTER UI primitive
 *
 * Usage:
 *   const [tab, setTab] = useState("contacts");
 *   <Tabs value={tab} onChange={setTab}>
 *     <TabsList>
 *       <Tab value="contacts">Contacts</Tab>
 *       <Tab value="import">Import CSV</Tab>
 *     </TabsList>
 *     <TabPanel value="contacts" active={tab === "contacts"}>…</TabPanel>
 *     <TabPanel value="import"   active={tab === "import"}>…</TabPanel>
 *   </Tabs>
 */
import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";

// ── Context ────────────────────────────────────────────────────

interface TabsContextValue {
  value:    string;
  onChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue>({
  value: "",
  onChange: () => {},
});

// ── Root ───────────────────────────────────────────────────────

interface TabsProps {
  value:     string;
  onChange:  (value: string) => void;
  children:  ReactNode;
  className?: string;
}

export function Tabs({ value, onChange, children, className }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onChange }}>
      <div className={cn("flex flex-col", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// ── TabsList ───────────────────────────────────────────────────

interface TabsListProps {
  children:  ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center gap-1 border-b border-border",
        className
      )}
    >
      {children}
    </div>
  );
}

// ── Tab (trigger) ──────────────────────────────────────────────

interface TabProps {
  value:      string;
  children:   ReactNode;
  disabled?:  boolean;
  className?: string;
}

export function Tab({ value, children, disabled, className }: TabProps) {
  const { value: current, onChange } = useContext(TabsContext);
  const isActive = current === value;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!disabled) onChange(value);
      }
    },
    [value, onChange, disabled]
  );

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => !disabled && onChange(value)}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        isActive
          ? "text-brand after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-px after:bg-brand"
          : "text-text-muted hover:text-text-primary",
        className
      )}
    >
      {children}
    </button>
  );
}

// ── TabPanel ───────────────────────────────────────────────────

interface TabPanelProps {
  value:      string;
  active:     boolean;
  children:   ReactNode;
  className?: string;
  /** Keep panel in DOM when inactive (default: unmount) */
  keepMounted?: boolean;
}

export function TabPanel({ value, active, children, className, keepMounted = false }: TabPanelProps) {
  if (!active && !keepMounted) return null;

  return (
    <div
      role="tabpanel"
      aria-hidden={!active}
      hidden={!active}
      id={`tabpanel-${value}`}
      className={cn("py-4", !active && "hidden", className)}
    >
      {children}
    </div>
  );
}
