export const fetchAnalyticsSummary = async (canteenId: string) => {
  const response = await fetch(`/api/v1/canteens/${canteenId}/analytics`);
  if (!response.ok) throw new Error('Failed to fetch analytics summary');
  return response.json();
};
