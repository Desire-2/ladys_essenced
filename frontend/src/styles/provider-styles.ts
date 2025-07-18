export const providerStyles = `
  .provider-card {
    transition: all 0.3s ease;
    border: 1px solid #e0e0e0;
  }
  
  .provider-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    border-color: #007bff;
  }
  
  .provider-avatar {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    color: white;
  }
  
  .time-slot-btn {
    transition: all 0.2s ease;
  }
  
  .time-slot-btn:hover:not(:disabled) {
    transform: scale(1.05);
  }
  
  .provider-dropdown .dropdown-menu {
    border: 1px solid #dee2e6;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    border-radius: 0.375rem;
  }
  
  .provider-dropdown .dropdown-item {
    padding: 12px 16px;
    border-bottom: 1px solid #f8f9fa;
    transition: background-color 0.2s ease;
  }
  
  .provider-dropdown .dropdown-item:hover {
    background-color: #f8f9fa;
  }
  
  .provider-dropdown .dropdown-item:last-child {
    border-bottom: none;
  }
  
  .search-highlight {
    background-color: #fff3cd;
    padding: 2px 4px;
    border-radius: 3px;
  }
`;

// Function to inject styles into the document
export const injectProviderStyles = () => {
  if (typeof window !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = providerStyles;
    document.head.appendChild(styleSheet);
  }
};
