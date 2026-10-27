export const fetchFinancialReports = async (canteenId: string, period = 'monthly') => {
  const response = await fetch(`/api/v1/canteens/${canteenId}/reports?period=${period}`);
  if (!response.ok) throw new Error('Failed to fetch financial report');
  return response.json();
};
