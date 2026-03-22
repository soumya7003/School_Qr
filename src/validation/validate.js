// export const sanitizeInput = (value) =>
/**
 * src/lib/validation/validation.js
 *
 * Complete Zod validation schemas for SchoolQR Guardian.
 * Covers every form input across the entire app.
 *
 * USAGE:
 *   import { schemas, validate, useZodForm } from '@/lib/validation/validation';
 *
 *   // One-shot validate
 *   const result = validate(schemas.login, { phone: '9876543210' });
 *   if (!result.ok) console.log(result.errors); // { phone: 'Invalid phone number' }
 *
 *   // In a component
 *   const { values, errors, setValue, validateAll } = useZodForm(schemas.login);
 */

import { z } from "zod";

// ─── Reusable field primitives ────────────────────────────────────────────────

const phoneField = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

const otpField = z
  .string()
  .trim()
  .regex(/^\d{4,6}$/, "OTP must be 4–6 digits");

const nameField = (label = "Name") =>
  z
    .string()
    .trim()
    .min(2, `${label} must be at least 2 characters`)
    .max(50, `${label} must be under 50 characters`)
    .regex(
      /^[a-zA-Z\s'-]+$/,
      `${label} can only contain letters, spaces, hyphens, apostrophes`,
    );

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(100, "Email too long");

const pinField = z
  .string()
  .trim()
  .regex(/^\d{4,6}$/, "PIN must be 4–6 digits");

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password too long") // bcrypt limit
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character",
  );

const urlField = z
  .string()
  .trim()
  .url("Enter a valid URL")
  .max(500, "URL too long")
  .optional()
  .or(z.literal(""));

// Strip dangerous characters from free-text fields
const safeText = (min = 0, max = 500, label = "Field") =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be under ${max} characters`)
    .refine(
      (val) => !/<[^>]*>|[<>'"`;\\]/.test(val),
      `${label} contains invalid characters`,
    );

// ─── Auth schemas ─────────────────────────────────────────────────────────────

const login = z.object({
  phone: phoneField,
});

const verifyOtp = z.object({
  phone: phoneField,
  otp: otpField,
});

const register = z.object({
  firstName: nameField("First name"),
  lastName: nameField("Last name"),
  phone: phoneField,
  email: emailField.optional().or(z.literal("")),
});

const changePhone = z.object({
  newPhone: phoneField,
  otp: otpField,
});

const changePin = z
  .object({
    currentPin: pinField,
    newPin: pinField,
    confirmPin: pinField,
  })
  .refine((d) => d.newPin === d.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
  })
  .refine((d) => d.currentPin !== d.newPin, {
    message: "New PIN must be different from current PIN",
    path: ["newPin"],
  });

// ─── Profile schemas ──────────────────────────────────────────────────────────

const updateProfile = z.object({
  firstName: nameField("First name"),
  lastName: nameField("Last name"),
  email: emailField.optional().or(z.literal("")),
  phone: phoneField.optional(),
});

// ─── Student schemas ──────────────────────────────────────────────────────────

const addStudent = z.object({
  firstName: nameField("First name"),
  lastName: nameField("Last name"),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((val) => {
      const date = new Date(val);
      const now = new Date();
      const age = (now - date) / (1000 * 60 * 60 * 24 * 365);
      return age >= 2 && age <= 20;
    }, "Student age must be between 2 and 20 years"),
  schoolName: safeText(2, 100, "School name"),
  grade: z
    .string()
    .trim()
    .regex(
      /^(Nursery|LKG|UKG|[1-9]|1[0-2])$/i,
      "Enter a valid grade (1–12, Nursery, LKG, UKG)",
    ),
  rollNumber: z
    .string()
    .trim()
    .max(20, "Roll number too long")
    .regex(
      /^[a-zA-Z0-9-]+$/,
      "Roll number can only contain letters, numbers, hyphens",
    )
    .optional()
    .or(z.literal("")),
});

const updateStudentMedical = z.object({
  bloodGroup: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"])
    .optional(),
  allergies: safeText(0, 300, "Allergies").optional().or(z.literal("")),
  medicalConditions: safeText(0, 500, "Medical conditions")
    .optional()
    .or(z.literal("")),
  medications: safeText(0, 300, "Medications").optional().or(z.literal("")),
  doctorName: nameField("Doctor name").optional().or(z.literal("")),
  doctorPhone: phoneField.optional().or(z.literal("")),
});

// ─── Emergency contact schemas ────────────────────────────────────────────────

const addEmergencyContact = z.object({
  name: nameField("Contact name"),
  phone: phoneField,
  relationship: z
    .string()
    .trim()
    .min(2, "Relationship is required")
    .max(30, "Relationship too long")
    .regex(/^[a-zA-Z\s]+$/, "Relationship can only contain letters"),
  isPrimary: z.boolean().optional().default(false),
});

const editEmergencyContact = addEmergencyContact.partial().extend({
  id: z.string().uuid("Invalid contact ID"),
});

// ─── SOS schema ───────────────────────────────────────────────────────────────

const triggerSos = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  location: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
  message: safeText(0, 200, "SOS message").optional().or(z.literal("")),
});

// ─── Settings schemas ─────────────────────────────────────────────────────────

const updateSettings = z.object({
  theme: z.enum(["light", "dark", "system"]),
  language: z.enum(["en", "hi", "bn"]), // add more as needed
  notificationsEnabled: z.boolean(),
  sosNotifications: z.boolean(),
  scanNotifications: z.boolean(),
});

const updatePin = z
  .object({
    newPin: pinField,
    confirmPin: pinField,
  })
  .refine((d) => d.newPin === d.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
  });

// ─── Support schema ───────────────────────────────────────────────────────────

const submitSupport = z.object({
  subject: safeText(5, 100, "Subject"),
  message: safeText(20, 1000, "Message"),
  category: z.enum(["bug", "account", "card", "emergency", "other"]),
});

// ─── Export all schemas ───────────────────────────────────────────────────────

export const schemas = {
  // Auth
  login,
  verifyOtp,
  register,
  changePhone,
  changePin,
  updatePin,
  // Profile
  updateProfile,
  // Students
  addStudent,
  updateStudentMedical,
  // Emergency
  addEmergencyContact,
  editEmergencyContact,
  // SOS
  triggerSos,
  // Settings
  updateSettings,
  // Support
  submitSupport,
};

// ─── validate() — one-shot validation helper ──────────────────────────────────
//
// Returns { ok: true, data } on success
// Returns { ok: false, errors: { field: 'message' } } on failure
//
// Usage:
//   const result = validate(schemas.login, { phone: '9876543210' });
//   if (!result.ok) setErrors(result.errors);
//   else callApi(result.data); // result.data is typed + sanitized

export const validate = (schema, values) => {
  const result = schema.safeParse(values);

  if (result.success) {
    return { ok: true, data: result.data };
  }

  // Flatten Zod errors into { fieldName: 'first error message' }
  const errors = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join(".");
    if (!errors[field]) errors[field] = issue.message;
  }

  return { ok: false, errors };
};

// ─── useZodForm() — React hook for form state + validation ───────────────────
//
// Usage:
//   const { values, errors, setValue, validateAll, resetErrors } =
//     useZodForm(schemas.login, { phone: '' });
//
//   <TextInput
//     value={values.phone}
//     onChangeText={(t) => setValue('phone', t)}
//   />
//   {errors.phone && <Text>{errors.phone}</Text>}
//
//   const onSubmit = () => {
//     const result = validateAll();
//     if (!result.ok) return;
//     callApi(result.data);
//   };

import { useState } from "react";

export const useZodForm = (schema, initialValues = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  // Update single field + clear its error
  const setValue = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Validate single field on blur
  const validateField = (field) => {
    const partial = schema.safeParse(values);
    if (!partial.success) {
      const issue = partial.error.issues.find((i) => i.path[0] === field);
      if (issue) setErrors((prev) => ({ ...prev, [field]: issue.message }));
    }
  };

  // Validate all fields — call on form submit
  const validateAll = () => {
    const result = validate(schema, values);
    if (!result.ok) setErrors(result.errors);
    else setErrors({});
    return result;
  };

  const resetErrors = () => setErrors({});

  const reset = (newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
  };

  return {
    values,
    errors,
    setValue,
    validateField,
    validateAll,
    resetErrors,
    reset,
  };
};
