export const updateStudentProfile = async (studentId: string, profile: any) => {
  const response = await fetch(`/api/v1/students/${studentId}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!response.ok) throw new Error('Failed to update student profile');
  return response.json();
};
