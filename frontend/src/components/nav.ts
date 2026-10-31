import {
  LayoutDashboard,
  FileText,
  Repeat,
  Receipt,
  Wallet,
  Package,
  Layers,
  Percent,
  Tag,
  UserCog,
  LucideIcon,
} from "lucide-react";
import { Role } from "../types";

export type NavItem = { to: string; label: string; icon: LucideIcon; roles?: Role[] };

export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  { title: "Overview", items: [{ to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    title: "Sales",
    items: [
      { to: "/app/templates", label: "Quotation templates", icon: FileText },
      { to: "/app/subscriptions", label: "Subscriptions", icon: Repeat },
    ],
  },
  {
    title: "Billing",
    items: [
      { to: "/app/invoices", label: "Invoices", icon: Receipt },
      { to: "/app/payments", label: "Payments", icon: Wallet },
    ],
  },
  {
    title: "Catalog",
    items: [
      { to: "/app/products", label: "Products", icon: Package },
      { to: "/app/plans", label: "Plans", icon: Layers },
      { to: "/app/taxes", label: "Taxes", icon: Percent },
      { to: "/app/discounts", label: "Discounts", icon: Tag },
    ],
  },
  { title: "Administration", items: [{ to: "/app/staff", label: "Staff", icon: UserCog, roles: ["ADMIN"] }] },
];
