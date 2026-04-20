// src/constants/profile.js
export const BLOOD_GROUPS = [
  "A+",
  "A−",
  "B+",
  "B−",
  "O+",
  "O−",
  "AB+",
  "AB−",
  "Unknown",
];

export const BLOOD_GROUP_TO_ENUM = {
  "A+": "A_POS",
  "A−": "A_NEG",
  "A-": "A_NEG",
  "B+": "B_POS",
  "B−": "B_NEG",
  "B-": "B_NEG",
  "O+": "O_POS",
  "O−": "O_NEG",
  "O-": "O_NEG",
  "AB+": "AB_POS",
  "AB−": "AB_NEG",
  "AB-": "AB_NEG",
  Unknown: "UNKNOWN",
  A_POS: "A_POS",
  A_NEG: "A_NEG",
  B_POS: "B_POS",
  B_NEG: "B_NEG",
  O_POS: "O_POS",
  O_NEG: "O_NEG",
  AB_POS: "AB_POS",
  AB_NEG: "AB_NEG",
  UNKNOWN: "UNKNOWN",
};

export const BLOOD_GROUP_FROM_ENUM = {
  A_POS: "A+",
  A_NEG: "A−",
  B_POS: "B+",
  B_NEG: "B−",
  O_POS: "O+",
  O_NEG: "O−",
  AB_POS: "AB+",
  AB_NEG: "AB−",
  UNKNOWN: "Unknown",
};

export const PRIORITY_COLORS = [
  "#F97316",
  "#FBBF24",
  "#60A5FA",
  "#A78BFA",
  "#22C55E",
];

export const STEPS = [
  {
    id: 0,
    short: "1",
    labelKey: "updates.stepStudent",
    label: "Student",
    banner: {
      emoji: "👤",
      title: "Add Your Child's Details",
      body: "Enter the name exactly as it appears on school records and upload a recent photo. This helps first responders identify your child quickly.",
      dos: ["Use the full legal name", "Upload a clear, recent photo"],
      donts: ["Don't use nicknames", "Don't upload blurry or old photos"],
    },
  },
  {
    id: 1,
    short: "2",
    labelKey: "updates.stepMedical",
    label: "Medical",
    banner: {
      emoji: "🏥",
      title: "Medical Information",
      body: "This information is shown to first responders when your child's card is scanned. Accurate data here can be life-saving.",
      dos: ["Select the correct blood group", "List all known allergies"],
      donts: [
        "Don't skip allergies if any exist",
        "Don't enter unknown medications",
      ],
    },
  },
  {
    id: 2,
    short: "3",
    labelKey: "updates.stepContacts",
    label: "Contacts",
    banner: {
      emoji: "📞",
      title: "Emergency Contacts",
      body: "Add at least 2 contacts who can be reached during an emergency. They will be called in priority order when the card is scanned.",
      dos: ["Add at least 2 contacts", "Use active mobile numbers"],
      donts: ["Don't use landline numbers", "Don't add duplicate numbers"],
    },
  },
  {
    id: 3,
    short: "4",
    labelKey: "updates.stepReview",
    label: "Review",
    banner: {
      emoji: "✅",
      title: "Review Before Activating",
      body: "Check all details carefully. Once the card is activated, this information will be used in real emergencies.",
      dos: [
        "Verify phone numbers are correct",
        "Confirm blood group is accurate",
      ],
      donts: [
        "Don't activate with placeholder data",
        "Don't skip reading the contact list",
      ],
    },
  },
];
