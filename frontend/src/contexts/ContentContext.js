'use client';

import { useState, createContext, useContext } from 'react';
import { contentAPI } from '../api';

// Create content context
const ContentContext = createContext();

export const ContentProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [contentItems, setContentItems] = useState([]);
  const [featuredContent, setFeaturedContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  // Fetch content categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await contentAPI.getCategories();
      setCategories(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch content categories');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch content items
  const fetchContentItems = async (page = 1, perPage = 10, categoryId = null) => {
    try {
      setLoading(true);
      setError(null);
      const response = await contentAPI.getContentItems(page, perPage, categoryId);
      setContentItems(response.data.items);
      setPagination({
        currentPage: response.data.current_page,
        totalPages: response.data.pages,
        totalItems: response.data.total
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch content items');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch single content item
  const fetchContentItem = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await contentAPI.getContentItem(id);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch content item');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch featured content
  const fetchFeaturedContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await contentAPI.getFeatured();
      setFeaturedContent(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch featured content');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Search content
  const searchContent = async (query) => {
    try {
      setLoading(true);
      setError(null);
      const response = await contentAPI.searchContent(query);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search content');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContentContext.Provider 
      value={{ 
        categories,
        contentItems,
        featuredContent,
        loading, 
        error, 
        pagination,
        fetchCategories,
        fetchContentItems,
        fetchContentItem,
        fetchFeaturedContent,
        searchContent
      }}
    >
      {children}
    </ContentContext.Provider>
  );
};

// Custom hook to use content context
export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};
