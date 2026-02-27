/**
 * School QR — Mock Data
 * All data shaped exactly like the Prisma schema models.
 * Used across all screens during UI development.
 */

// ── ParentUser ────────────────────────────────────────────────────────────────
export const mockParent = {
  id: "parent-001",
  email: "priya.sharma@gmail.com",
  phone: "+919876543210",
  is_phone_verified: true,
  is_email_verified: false,
  status: "ACTIVE",
  created_at: "2024-08-01T10:00:00Z",
  last_login_at: "2025-02-27T08:00:00Z",
};

// ── School ────────────────────────────────────────────────────────────────────
export const mockSchool = {
  id: "school-001",
  name: "Delhi Public School",
  code: "DPS-DEL-001",
  city: "New Delhi",
  country: "IN",
  logo_url: null,
  is_active: true,
};

// ── Student ───────────────────────────────────────────────────────────────────
export const mockStudent = {
  id: "student-001",
  school_id: "school-001",
  first_name: "Arjun",
  last_name: "Sharma",
  class: "6",
  section: "B",
  photo_url: null,
  is_active: true,
  created_at: "2024-08-01T10:00:00Z",
  school: mockSchool,
};

// ── EmergencyProfile ──────────────────────────────────────────────────────────
export const mockEmergencyProfile = {
  id: "ep-001",
  student_id: "student-001",
  blood_group: "B+",
  allergies: "Peanuts",
  conditions: "Mild Asthma",
  medications: "Salbutamol inhaler (as needed)",
  doctor_name: "Dr. Ramesh Mehta",
  doctor_phone: "+919812345678",
  notes: "Keep inhaler accessible at all times.",
  visibility: "PUBLIC",
  is_visible: true,
};

// ── EmergencyContacts ─────────────────────────────────────────────────────────
export const mockContacts = [
  {
    id: "ec-001",
    profile_id: "ep-001",
    name: "Priya Sharma",
    phone: "+919876543210",
    relationship: "Mother",
    is_active: true,
    priority: 1,
  },
  {
    id: "ec-002",
    profile_id: "ep-001",
    name: "Rajesh Sharma",
    phone: "+919876501234",
    relationship: "Father",
    is_active: true,
    priority: 2,
  },
];

// ── Token (the QR card) ───────────────────────────────────────────────────────
export const mockToken = {
  id: "token-001",
  school_id: "school-001",
  student_id: "student-001",
  token_hash: "SQ-2024-004891",
  status: "ACTIVE", // TokenStatus enum
  expires_at: "2025-08-01T00:00:00Z",
  activated_at: "2024-08-15T10:00:00Z",
  assigned_at: "2024-08-10T09:00:00Z",
  created_at: "2024-07-01T00:00:00Z",
};

// ── Token (new user — not yet active) ────────────────────────────────────────
export const mockTokenPending = {
  ...mockToken,
  id: "token-002",
  token_hash: "SQ-2024-009234",
  status: "ISSUED",
  activated_at: null,
};

// ── ScanLog entries ───────────────────────────────────────────────────────────
export const mockScanLogs = [
  {
    id: "scan-001",
    token_id: "token-001",
    result: "SUCCESS",
    scan_purpose: "UNKNOWN",
    device: "Gate Scanner v2",
    ip_city: "New Delhi",
    ip_country: "IN",
    created_at: "2025-02-27T08:14:00Z",
    latitude: 28.6139,
    longitude: 77.209,
    // UI display fields
    _label: "School Gate – Entry",
    _sublabel: "DPS Delhi · Security Guard",
  },
  {
    id: "scan-002",
    token_id: "token-001",
    result: "SUCCESS",
    scan_purpose: "UNKNOWN",
    device: "Library Terminal",
    ip_city: "New Delhi",
    ip_country: "IN",
    created_at: "2025-02-26T11:30:00Z",
    latitude: null,
    longitude: null,
    _label: "Library Access",
    _sublabel: "DPS Delhi · Library Staff",
  },
  {
    id: "scan-003",
    token_id: "token-001",
    result: "SUCCESS",
    scan_purpose: "UNKNOWN",
    device: "Gate Scanner v2",
    ip_city: "New Delhi",
    ip_country: "IN",
    created_at: "2025-02-26T08:10:00Z",
    latitude: 28.6139,
    longitude: 77.209,
    _label: "School Gate – Entry",
    _sublabel: "DPS Delhi · Security Guard",
  },
  {
    id: "scan-004",
    token_id: "token-001",
    result: "SUCCESS",
    scan_purpose: "EMERGENCY",
    device: "Staff Phone",
    ip_city: "New Delhi",
    ip_country: "IN",
    created_at: "2025-02-25T14:22:00Z",
    latitude: null,
    longitude: null,
    _label: "Emergency Scan",
    _sublabel: "DPS Delhi · Class Teacher",
  },
];

// ── Subscription ──────────────────────────────────────────────────────────────
export const mockSubscription = {
  id: "sub-001",
  school_id: "school-001",
  status: "ACTIVE", // SubscriptionStatus enum
  plan: "PRO",
  current_period_end: "2026-08-01T00:00:00Z",
};

// ── StudentUpdateRequest ──────────────────────────────────────────────────────
export const mockUpdateRequests = [
  {
    id: "req-001",
    student_id: "student-001",
    parent_id: "parent-001",
    changes: {
      conditions: "Mild Asthma, Eczema",
      medications: "Salbutamol, Cetrizine",
    },
    status: "PENDING",
    created_at: "2025-02-25T10:00:00Z",
  },
];

// ── ParentStudent (link) ──────────────────────────────────────────────────────
export const mockParentStudent = {
  id: "ps-001",
  parent_id: "parent-001",
  student_id: "student-001",
  relationship: "Mother",
  is_primary: true,
  student: mockStudent,
};

// ── Composed "full profile" object ────────────────────────────────────────────
// This is what the home screen and profile screen use.
export const mockFullProfile = {
  parent: mockParent,
  parentStudent: mockParentStudent,
  student: mockStudent,
  emergencyProfile: mockEmergencyProfile,
  contacts: mockContacts,
  token: mockToken,
  subscription: mockSubscription,
  scanLogs: mockScanLogs,
  updateRequests: mockUpdateRequests,
};

// ── New user state (incomplete profile) ───────────────────────────────────────
export const mockNewUserProfile = {
  ...mockFullProfile,
  token: mockTokenPending,
  emergencyProfile: {
    ...mockEmergencyProfile,
    blood_group: null,
    allergies: null,
    conditions: null,
    doctor_name: null,
    doctor_phone: null,
  },
  contacts: [],
  scanLogs: [],
};
