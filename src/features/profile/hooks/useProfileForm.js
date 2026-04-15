// src/features/profile/hooks/useProfileForm.js
import { BLOOD_GROUP_FROM_ENUM } from "@/constants/profile";
import { useEffect, useMemo, useState } from "react";

export function useProfileForm(student) {
  const ep = student?.emergency ?? null;
  const rawContacts = useMemo(
    () => student?.emergency?.contacts ?? [],
    [student?.emergency?.contacts],
  );

  const [firstName, setFirstName] = useState(student?.first_name ?? "");
  const [lastName, setLastName] = useState(student?.last_name ?? "");
  const [cls, setCls] = useState(student?.class ?? "");
  const [section, setSection] = useState(student?.section ?? "");
  const [profileImage, setProfileImage] = useState(student?.photo_url ?? null);
  const [bloodGroup, setBloodGroup] = useState(
    BLOOD_GROUP_FROM_ENUM[ep?.blood_group] ?? ep?.blood_group ?? "",
  );
  const [allergies, setAllergies] = useState(ep?.allergies ?? "");
  const [conditions, setConditions] = useState(ep?.conditions ?? "");
  const [medications, setMedications] = useState(ep?.medications ?? "");
  const [doctorName, setDoctorName] = useState(ep?.doctor_name ?? "");
  const [doctorPhone, setDoctorPhone] = useState(ep?.doctor_phone ?? "");
  const [notes, setNotes] = useState(ep?.notes ?? "");
  const [contacts, setContacts] = useState(rawContacts ?? []);

  useEffect(() => {
    setFirstName(student?.first_name ?? "");
    setLastName(student?.last_name ?? "");
    setCls(student?.class ?? "");
    setSection(student?.section ?? "");
    setProfileImage(student?.photo_url ?? null);
  }, [student]);

  useEffect(() => {
    setBloodGroup(
      BLOOD_GROUP_FROM_ENUM[ep?.blood_group] ?? ep?.blood_group ?? "",
    );
    setAllergies(ep?.allergies ?? "");
    setConditions(ep?.conditions ?? "");
    setMedications(ep?.medications ?? "");
    setDoctorName(ep?.doctor_name ?? "");
    setDoctorPhone(ep?.doctor_phone ?? "");
    setNotes(ep?.notes ?? "");
  }, [ep]);

  useEffect(() => {
    setContacts(rawContacts ?? []);
  }, [rawContacts]);

  const sortedContacts = [...contacts].sort((a, b) => a.priority - b.priority);
  const canProceed = firstName.trim().length > 0 && lastName.trim().length > 0;

  return {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    cls,
    setCls,
    section,
    setSection,
    profileImage,
    setProfileImage,
    bloodGroup,
    setBloodGroup,
    allergies,
    setAllergies,
    conditions,
    setConditions,
    medications,
    setMedications,
    doctorName,
    setDoctorName,
    doctorPhone,
    setDoctorPhone,
    notes,
    setNotes,
    contacts,
    setContacts,
    sortedContacts,
    canProceed,
  };
}
