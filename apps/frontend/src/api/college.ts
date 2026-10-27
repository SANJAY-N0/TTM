export const fetchCollegesList = async () => {
  const response = await fetch('/api/v1/colleges');
  if (!response.ok) throw new Error('Failed to fetch colleges');
  return response.json();
};
