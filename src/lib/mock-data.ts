// Mock data layer. Replace with Supabase calls later.
// All data shapes mirror the planned tables so swapping implementations is trivial.

export type Role = "admin" | "manager" | "hr" | "executive";

export interface User {
  id: string;
  username: string;
  password: string; // mock only
  fullName: string;
  role: Role;
  region?: string;
  managerId?: string;
  joinedAt: string;
  active: boolean;
}

export interface DailyReport {
  id: string;
  executiveId: string;
  date: string; // YYYY-MM-DD
  visits: number;
  newOutlets: number;
  ordersValue: number;
  collections: number;
  notes: string;
}

export interface Visit {
  id: string;
  executiveId: string;
  outletName: string;
  date: string;
  status: "productive" | "non-productive";
  remarks: string;
}

export interface Order {
  id: string;
  executiveId: string;
  outletName: string;
  date: string;
  amount: number;
  products: string;
  status: "pending" | "approved" | "delivered";
}

export interface Attendance {
  id: string;
  executiveId: string;
  date: string;
  status: "present" | "absent" | "leave";
  checkIn?: string;
}

const today = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const dayOffset = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return iso(d);
};

export const mockUsers: User[] = [
  { id: "u1", username: "admin", password: "admin123", fullName: "Ravi Sharma", role: "admin", joinedAt: "2023-01-15", active: true },
  { id: "u2", username: "manager", password: "manager123", fullName: "Priya Iyer", role: "manager", region: "South", joinedAt: "2023-03-10", active: true },
  { id: "u3", username: "hr", password: "hr123", fullName: "Anil Kapoor", role: "hr", joinedAt: "2023-02-01", active: true },
  { id: "u4", username: "sales1", password: "sales123", fullName: "Vikram Singh", role: "executive", region: "South", managerId: "u2", joinedAt: "2024-01-20", active: true },
  { id: "u5", username: "sales2", password: "sales123", fullName: "Neha Verma", role: "executive", region: "South", managerId: "u2", joinedAt: "2024-04-12", active: true },
  { id: "u6", username: "sales3", password: "sales123", fullName: "Arjun Mehta", role: "executive", region: "North", managerId: "u2", joinedAt: "2024-06-05", active: true },
];

export const mockReports: DailyReport[] = [
  { id: "r1", executiveId: "u4", date: dayOffset(0), visits: 12, newOutlets: 2, ordersValue: 45000, collections: 30000, notes: "Strong demand in HUL SKUs" },
  { id: "r2", executiveId: "u4", date: dayOffset(1), visits: 10, newOutlets: 1, ordersValue: 38000, collections: 25000, notes: "" },
  { id: "r3", executiveId: "u5", date: dayOffset(0), visits: 14, newOutlets: 3, ordersValue: 52000, collections: 40000, notes: "Festive stock loading" },
  { id: "r4", executiveId: "u5", date: dayOffset(1), visits: 11, newOutlets: 0, ordersValue: 29000, collections: 18000, notes: "" },
  { id: "r5", executiveId: "u6", date: dayOffset(0), visits: 8, newOutlets: 1, ordersValue: 22000, collections: 15000, notes: "Two outlets closed" },
];

export const mockVisits: Visit[] = [
  { id: "v1", executiveId: "u4", outletName: "Sri Krishna Stores", date: dayOffset(0), status: "productive", remarks: "Order placed" },
  { id: "v2", executiveId: "u4", outletName: "MK Supermarket", date: dayOffset(0), status: "non-productive", remarks: "Owner unavailable" },
  { id: "v3", executiveId: "u5", outletName: "Annapurna Mart", date: dayOffset(0), status: "productive", remarks: "Repeat order" },
];

export const mockOrders: Order[] = [
  { id: "o1", executiveId: "u4", outletName: "Sri Krishna Stores", date: dayOffset(0), amount: 18500, products: "HUL, ITC", status: "approved" },
  { id: "o2", executiveId: "u5", outletName: "Annapurna Mart", date: dayOffset(0), amount: 22300, products: "Nestle, Britannia", status: "pending" },
  { id: "o3", executiveId: "u6", outletName: "Royal Bazaar", date: dayOffset(1), amount: 14000, products: "Dabur", status: "delivered" },
];

export const mockAttendance: Attendance[] = [
  { id: "a1", executiveId: "u4", date: dayOffset(0), status: "present", checkIn: "09:12" },
  { id: "a2", executiveId: "u5", date: dayOffset(0), status: "present", checkIn: "09:05" },
  { id: "a3", executiveId: "u6", date: dayOffset(0), status: "leave" },
];

// Simple in-memory mutable stores (will be replaced by Supabase queries)
export const db = {
  users: [...mockUsers],
  reports: [...mockReports],
  visits: [...mockVisits],
  orders: [...mockOrders],
  attendance: [...mockAttendance],
};

export function userById(id: string) {
  return db.users.find((u) => u.id === id);
}
