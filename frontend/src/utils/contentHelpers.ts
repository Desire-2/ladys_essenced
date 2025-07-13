export const addTagHandler = (
  tagInput: string,
  setTagInput: (value: string) => void,
  formData: any,
  setFormData: (data: any) => void
) => {
  if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
    setFormData({
      ...formData,
      tags: [...formData.tags, tagInput.trim()]
    });
    setTagInput('');
  }
};

export const removeTagHandler = (
  tagToRemove: string,
  formData: any,
  setFormData: (data: any) => void
) => {
  setFormData({
    ...formData,
    tags: formData.tags.filter((tag: string) => tag !== tagToRemove)
  });
};

export const addKeywordHandler = (
  keywordInput: string,
  setKeywordInput: (value: string) => void,
  formData: any,
  setFormData: (data: any) => void
) => {
  if (keywordInput.trim() && !formData.seo_keywords.includes(keywordInput.trim())) {
    setFormData({
      ...formData,
      seo_keywords: [...formData.seo_keywords, keywordInput.trim()]
    });
    setKeywordInput('');
  }
};

export const removeKeywordHandler = (
  keywordToRemove: string,
  formData: any,
  setFormData: (data: any) => void
) => {
  setFormData({
    ...formData,
    seo_keywords: formData.seo_keywords.filter((keyword: string) => keyword !== keywordToRemove)
  });
};

export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export const calculateReadingTime = (content: string): number => {
  const words = content.split(/\s+/).filter(word => word.length > 0).length;
  return Math.ceil(words / 200); // Average reading speed: 200 words per minute
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'published': return 'success';
    case 'draft': return 'warning';
    case 'pending_review': return 'info';
    case 'rejected': return 'danger';
    default: return 'secondary';
  }
};

export const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'published': return 'fas fa-check-circle';
    case 'draft': return 'fas fa-edit';
    case 'pending_review': return 'fas fa-clock';
    case 'rejected': return 'fas fa-times-circle';
    default: return 'fas fa-file';
  }
};
