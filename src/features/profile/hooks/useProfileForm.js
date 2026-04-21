// src/features/profile/hooks/useProfileForm.js - FIXED
import { BLOOD_GROUP_FROM_ENUM } from "@/constants/profile";
import { useEffect, useMemo, useState } from "react";

export function useProfileForm(student) {
  const ep = student?.emergency ?? null;
  const rawContacts = useMemo(
    () => student?.emergency?.contacts ?? [],
    [student?.emergency?.contacts],
  );

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [cls, setCls] = useState("");
  const [section, setSection] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [bloodGroup, setBloodGroup] = useState("");
  const [allergies, setAllergies] = useState("");
  const [conditions, setConditions] = useState("");
  const [medications, setMedications] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [doctorPhone, setDoctorPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [contacts, setContacts] = useState([]);

  // ✅ Helper to get proper image URL
  const getPhotoUrl = (photoKey) => {
    if (!photoKey) return null;
    if (photoKey.startsWith("https://") || photoKey.startsWith("file://")) {
      return photoKey;
    }
    return `https://assets.getresqid.in/${photoKey}`;
  };

  // ✅ Load ALL student fields when student changes
  useEffect(() => {
    if (student) {
      setFirstName(student.first_name ?? "");
      setLastName(student.last_name ?? "");
      setDob(student.dob ?? ""); // ✅ ADDED
      setGender(student.gender ?? ""); // ✅ ADDED
      setCls(student.class ?? "");
      setSection(student.section ?? "");
      setProfileImage(getPhotoUrl(student.photo_url));
    }
  }, [student]);

  // ✅ Load emergency fields when emergency changes
  useEffect(() => {
    if (ep) {
      setBloodGroup(
        BLOOD_GROUP_FROM_ENUM[ep.blood_group] ?? ep.blood_group ?? "",
      );
      setAllergies(ep.allergies ?? "");
      setConditions(ep.conditions ?? "");
      setMedications(ep.medications ?? "");
      setDoctorName(ep.doctor_name ?? "");
      setDoctorPhone(ep.doctor_phone ?? "");
      setNotes(ep.notes ?? "");
    }
  }, [ep]);

  // ✅ Load contacts
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
    dob,
    setDob,
    gender,
    setGender,
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
    getPhotoUrl,
  };
}
