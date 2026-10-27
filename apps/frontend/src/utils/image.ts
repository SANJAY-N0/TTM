export const getCloudinaryImageUrl = (publicId: string, options?: { width?: number; height?: number; crop?: string }) => {
  if (!publicId) return '';
  if (publicId.startsWith('http')) return publicId;
  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
  const transformations = options
    ? `c_${options.crop || 'fill'},w_${options.width || 400},h_${options.height || 400}/`
    : '';
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}${publicId}`;
};

export const getSafeFoodImage = (imageUrl?: string, category?: string): string => {
  if (imageUrl && imageUrl.trim().length > 0) return imageUrl;
  const lowerCat = (category || '').toLowerCase();
  if (lowerCat.includes('beverage') || lowerCat.includes('drink') || lowerCat.includes('shake')) {
    return 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&auto=format&fit=crop&q=60';
  }
  if (lowerCat.includes('snack') || lowerCat.includes('fast food')) {
    return 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=500&auto=format&fit=crop&q=60';
  }
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60';
};

export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, category?: string) => {
  e.currentTarget.src = getSafeFoodImage('', category);
};
