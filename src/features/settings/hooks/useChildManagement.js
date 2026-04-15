import { useRouter } from 'expo-router';
import { useProfileStore } from '@/features/profile/profile.store';

export function useChildManagement() {
  const router = useRouter();
  const removeStudent = useProfileStore((s) => s.removeStudent);
  const setActiveStudent = useProfileStore((s) => s.setActiveStudent);
  const students = useProfileStore((s) => s.students);

  const handleAddChild = () => router.push('/add-child');

  const handleRemoveChild = (id, name) => {
    removeStudent(id);
    if (students.length === 1) setActiveStudent(null);
    else if (students[0]?.id === id) setActiveStudent(students[1]?.id);
  };

  const handleSwitchStudent = (id) => setActiveStudent(id);

  return { handleAddChild, handleRemoveChild, handleSwitchStudent };
}