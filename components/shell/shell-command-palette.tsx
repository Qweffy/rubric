"use client";

import { useRouter } from "next/navigation";

import {
  NAV_GROUPS,
  PINNED_NAV,
  type ShellNavItem,
} from "@/components/shell/nav-items";
import {
  CommandPalette,
  type CommandGroup,
  type CommandItem,
} from "@/components/ui/command-palette";

export interface ShellCommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

function toCommandItem(item: ShellNavItem): CommandItem {
  return {
    id: `nav:${item.href}`,
    label: item.label,
    icon: item.icon,
    hint: item.hint,
  };
}

/**
 * Shell-level ⌘K palette. Surfaces the grouped nav as commands — selecting a
 * row routes to it. Mirrors the design system's palette layout: mono search,
 * grouped results, keyboard nav handled by the generic CommandPalette.
 */
export function ShellCommandPalette({ open, onClose }: ShellCommandPaletteProps) {
  const router = useRouter();

  const groups: CommandGroup[] = [
    {
      label: "Navigate",
      items: [
        ...NAV_GROUPS.flatMap((group) => group.items.map(toCommandItem)),
        toCommandItem(PINNED_NAV),
      ],
    },
  ];

  const handleSelect = (item: CommandItem) => {
    if (item.id.startsWith("nav:")) {
      router.push(item.id.slice("nav:".length));
      onClose();
    }
  };

  return (
    <CommandPalette
      open={open}
      onClose={onClose}
      groups={groups}
      placeholder="Jump to suite, run, case…"
      onSelect={handleSelect}
    />
  );
}
