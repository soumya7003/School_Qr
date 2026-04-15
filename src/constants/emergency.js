export const VISIBILITY_CONFIG = {
  PUBLIC: { iconName: 'eye', tier: 0, fields: ['blood_group', 'allergies', 'conditions', 'medications', 'doctor_name', 'doctor_phone', 'notes', 'contacts'] },
  MINIMAL: { iconName: 'eye', tier: 1, fields: ['blood_group', 'contacts'] },
  HIDDEN: { iconName: 'eye-off', tier: 2, fields: [] },
};

export const VIS_OPTIONS = [
  { key: 'PUBLIC', labelKey: 'emergency.visPublicLabel', iconName: 'eye', detailKey: 'emergency.visPublicDetail' },
  { key: 'MINIMAL', labelKey: 'emergency.visMinimalLabel', iconName: 'eye', detailKey: 'emergency.visMinimalDetail' },
  { key: 'HIDDEN', labelKey: 'emergency.visHiddenLabel', iconName: 'eye-off', detailKey: 'emergency.visHiddenDetail' },
];

export const ALL_FIELD_KEYS = [
  { key: 'blood_group', labelKey: 'emergency.fieldBloodGroup', sublabel: 'e.g. A+, O−', categoryKey: 'emergency.categoryMedical', minimalAllowed: true },
  { key: 'allergies', labelKey: 'emergency.fieldAllergies', sublabel: 'Food, medication, environmental', categoryKey: 'emergency.categoryMedical', minimalAllowed: false },
  { key: 'conditions', labelKey: 'emergency.fieldConditions', sublabel: 'Asthma, diabetes, epilepsy…', categoryKey: 'emergency.categoryMedical', minimalAllowed: false },
  { key: 'medications', labelKey: 'emergency.fieldMedications', sublabel: 'Current prescriptions', categoryKey: 'emergency.categoryMedical', minimalAllowed: false },
  { key: 'doctor_name', labelKey: 'emergency.fieldDoctorName', sublabel: 'Family / consulting doctor', categoryKey: 'emergency.categoryPhysician', minimalAllowed: false },
  { key: 'doctor_phone', labelKey: 'emergency.fieldDoctorPhone', sublabel: 'Direct contact number', categoryKey: 'emergency.categoryPhysician', minimalAllowed: false },
  { key: 'notes', labelKey: 'emergency.fieldNotes', sublabel: 'Special instructions', categoryKey: 'emergency.categoryOther', minimalAllowed: false },
  { key: 'contacts', labelKey: 'emergency.fieldContacts', sublabel: 'Emergency call list', categoryKey: 'emergency.categoryContacts', minimalAllowed: true },
];

export function isFieldVisible(fieldKey, visibility, hiddenFields = []) {
  if (visibility === 'HIDDEN') return false;
  if (visibility === 'MINIMAL') return VISIBILITY_CONFIG.MINIMAL.fields.includes(fieldKey) && !hiddenFields.includes(fieldKey);
  return !hiddenFields.includes(fieldKey);
}

export function getVisColor(key, C) {
  if (key === 'PUBLIC') return C.ok;
  if (key === 'MINIMAL') return C.amb;
  return C.red;
}