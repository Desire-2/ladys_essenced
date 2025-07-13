export const buildApiUrl = (endpoint: string, params?: Record<string, any>) => {
  const baseUrl = '/api/admin';
  let url = `${baseUrl}${endpoint}`;
  
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    if (searchParams.toString()) {
      url += `?${searchParams.toString()}`;
    }
  }
  
  return url;
};

export const buildContentWriterApiUrl = (endpoint: string, params?: Record<string, any>) => {
  const baseUrl = '/api/content-writer';
  let url = `${baseUrl}${endpoint}`;
  
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    if (searchParams.toString()) {
      url += `?${searchParams.toString()}`;
    }
  }
  
  return url;
};

export const buildHealthProviderApiUrl = (endpoint: string, params?: Record<string, any>) => {
  const baseUrl = '/api/health-provider';
  let url = `${baseUrl}${endpoint}`;
  
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    if (searchParams.toString()) {
      url += `?${searchParams.toString()}`;
    }
  }
  
  return url;
};

export const buildAuthApiUrl = (endpoint: string, params?: Record<string, any>) => {
  const baseUrl = '/api/auth';
  let url = `${baseUrl}${endpoint}`;
  
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    if (searchParams.toString()) {
      url += `?${searchParams.toString()}`;
    }
  }
  
  return url;
};
