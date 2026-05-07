// Mock data layer. Replace with Supabase calls later.

export type Role = "admin" | "manager" | "hr" | "executive";

export interface User {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: Role;
  region?: string;
  managerId?: string;
  joinedAt: string;
  active: boolean;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  place: string;
  contactPerson: string;
  contactNumber: string;
  gstNumber?: string;
  active: boolean;
}

export interface Company {
  id: string;
  code: string;
  name: string;
  brand: string;
  active: boolean;
}

export interface DailyReport {
  id: string;
  executiveId: string;
  date: string;
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

export type VisitType =
  | "Direct Visit"
  | "Telephonic"
  | "WhatsApp"
  | "Video Call"
  | "Distributor Meeting"
  | "Retail Visit"
  | "Follow-up";

export type CollectionMode = "Cash" | "NEFT" | "RTGS" | "UPI" | "PDC" | "Cheque";

export interface VisitReport {
  id: string;
  executiveId: string;
  date: string;
  companyId: string;
  customerId: string;
  place: string;
  visitType: VisitType;
  orderValue: number;
  collectionAmount: number;
  collectionMode?: CollectionMode;
  collectionNotes: string;
  feedback: string;
  status: "draft" | "submitted";
  createdAt: string;
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

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: "reminder" | "alert" | "info";
  read: boolean;
  createdAt: string;
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

export const mockCustomers: Customer[] = [
  { id: "c1", code: "CUS001", name: "Sri Krishna Stores", place: "Chennai", contactPerson: "K. Murali", contactNumber: "9840012345", gstNumber: "33AABCS1234A1Z5", active: true },
  { id: "c2", code: "CUS002", name: "Annapurna Mart", place: "Bangalore", contactPerson: "S. Raghav", contactNumber: "9845567890", gstNumber: "29AABCA9876B1Z2", active: true },
  { id: "c3", code: "CUS003", name: "MK Supermarket", place: "Coimbatore", contactPerson: "Mahesh K", contactNumber: "9842234567", active: true },
  { id: "c4", code: "CUS004", name: "Royal Bazaar", place: "Hyderabad", contactPerson: "Rajesh", contactNumber: "9849988776", active: true },
  { id: "c5", code: "CUS005", name: "Daily Needs", place: "Chennai", contactPerson: "Selvi", contactNumber: "9840099887", active: false },
];

export const mockCompanies: Company[] = [
  { id: "co1", code: "HUL", name: "Hindustan Unilever", brand: "HUL", active: true },
  { id: "co2", code: "ITC", name: "ITC Limited", brand: "ITC", active: true },
  { id: "co3", code: "NES", name: "Nestle India", brand: "Nestle", active: true },
  { id: "co4", code: "BRT", name: "Britannia Industries", brand: "Britannia", active: true },
  { id: "co5", code: "DBR", name: "Dabur India", brand: "Dabur", active: true },
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

export const mockVisitReports: VisitReport[] = [
  { id: "vr1", executiveId: "u4", date: dayOffset(0), companyId: "co1", customerId: "c1", place: "Chennai", visitType: "Direct Visit", orderValue: 18500, collectionAmount: 10000, collectionMode: "UPI", collectionNotes: "UPI Ref: TXN8821", feedback: "Strong demand for HUL detergents", status: "submitted", createdAt: new Date().toISOString() },
  { id: "vr2", executiveId: "u5", date: dayOffset(0), companyId: "co3", customerId: "c2", place: "Bangalore", visitType: "Retail Visit", orderValue: 22300, collectionAmount: 15000, collectionMode: "Cheque", collectionNotes: "Cheque #441221, HDFC", feedback: "Competitor offering 5% extra margin", status: "submitted", createdAt: new Date().toISOString() },
  { id: "vr3", executiveId: "u6", date: dayOffset(1), companyId: "co5", customerId: "c4", place: "Hyderabad", visitType: "Follow-up", orderValue: 0, collectionAmount: 8000, collectionMode: "Cash", collectionNotes: "", feedback: "Awaiting product samples", status: "submitted", createdAt: new Date().toISOString() },
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

export const mockNotifications: Notification[] = [
  { id: "n1", userId: "u4", title: "Submit today's report", body: "Your daily visit report is pending submission.", type: "reminder", read: false, createdAt: new Date().toISOString() },
  { id: "n2", userId: "u4", title: "Collection follow-up", body: "PDC for Sri Krishna Stores is due tomorrow.", type: "alert", read: false, createdAt: new Date().toISOString() },
  { id: "n3", userId: "u5", title: "Daily reporting alert", body: "Reminder: log all visits before 8:00 PM.", type: "info", read: true, createdAt: new Date().toISOString() },
  { id: "n4", userId: "u2", title: "Team performance", body: "Vikram exceeded weekly target by 12%.", type: "info", read: false, createdAt: new Date().toISOString() },
];

export const db = {
  users: [...mockUsers],
  customers: [...mockCustomers],
  companies: [...mockCompanies],
  reports: [...mockReports],
  visits: [...mockVisits],
  visitReports: [...mockVisitReports],
  orders: [...mockOrders],
  attendance: [...mockAttendance],
  notifications: [...mockNotifications],
};

export function userById(id: string) {
  return db.users.find((u) => u.id === id);
}
export function customerById(id: string) {
  return db.customers.find((c) => c.id === id);
}
export function companyById(id: string) {
  return db.companies.find((c) => c.id === id);
}
