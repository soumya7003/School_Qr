// src/services/mock/mockService.js
import { storage } from "@/lib/storage/storage";
import { mockFullProfile, mockScanLogs } from "../mock/mockData";

const USE_MOCK = __DEV__; // Only use mock in development

// Mock API responses
export const mockApi = {
  // Auth endpoints
  sendOtp: async (phone) => {
    await delay(800);
    return { success: true, data: { isNewUser: false } };
  },

  verifyOtp: async (phone, otp) => {
    await delay(800);
    return {
      success: true,
      data: {
        access_token: "mock_access_token_" + Date.now(),
        refresh_token: "mock_refresh_token_" + Date.now(),
        expires_at: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        is_new_user: false,
        parent_id: "parent-001",
      },
    };
  },

  registerInit: async (card_number, phone) => {
    await delay(800);
    return {
      success: true,
      data: {
        nonce: "mock_nonce_" + Date.now(),
        masked_phone: phone.replace(/(\+\d{2})(\d{5})(\d{5})/, "$1 *****$3"),
        student_first_name: null,
      },
    };
  },

  registerVerify: async (nonce, otp, phone) => {
    await delay(800);
    return {
      success: true,
      data: {
        access_token: "mock_access_token_" + Date.now(),
        refresh_token: "mock_refresh_token_" + Date.now(),
        expires_at: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        is_new_user: true,
        parent_id: "parent-002",
        student_id: "student-002",
      },
    };
  },

  // Profile endpoints
  getFullProfile: async () => {
    await delay(500);
    return mockFullProfile;
  },

  updateProfile: async (studentId, payload) => {
    await delay(600);
    return { cache_invalidated: true };
  },

  updateVisibility: async (studentId, { visibility, hidden_fields }) => {
    await delay(400);
    return { cache_invalidated: true };
  },

  updateNotifications: async (prefs) => {
    await delay(400);
    return { cache_invalidated: true };
  },

  updateLocationConsent: async (studentId, enabled) => {
    await delay(400);
    return { cache_invalidated: true };
  },

  lockCard: async (studentId) => {
    await delay(600);
    return { locked: true, count: 1, cache_invalidated: true };
  },

  requestReplace: async (studentId, reason) => {
    await delay(600);
    return { id: "req-" + Date.now(), created_at: new Date().toISOString() };
  },

  deleteAccount: async () => {
    await delay(800);
    return { success: true, message: "Account deleted" };
  },

  getScanHistory: async ({ cursor, limit = 20, filter = "all" }) => {
    await delay(400);
    let scans = [...mockScanLogs];
    if (filter === "emergency") {
      scans = scans.filter((s) => s.scan_purpose === "EMERGENCY");
    } else if (filter === "success") {
      scans = scans.filter((s) => s.result === "SUCCESS");
    } else if (filter === "flagged") {
      scans = scans.filter((s) => s.result !== "SUCCESS");
    }

    const hasMore = scans.length > limit;
    const paginated = scans.slice(0, limit);
    const nextCursor = hasMore ? paginated[paginated.length - 1]?.id : null;

    return {
      scans: paginated,
      anomalies: [],
      hasMore,
      nextCursor,
    };
  },

  // Notification endpoints
  registerDeviceToken: async (token) => {
    await delay(300);
    return { success: true };
  },
};

// Helper
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock storage for development
export const mockStorage = {
  readAuth: async () => {
    if (!USE_MOCK) return null;
    const mock = await storage.readAuth();
    if (mock) return mock;
    return {
      accessToken: "mock_access_token",
      refreshToken: "mock_refresh_token",
      expiresAt: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      isNewUser: false,
    };
  },
  // Passthrough to real storage for other methods
  ...storage,
};
