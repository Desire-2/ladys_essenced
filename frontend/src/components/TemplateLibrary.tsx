'use client';

import { useState, useEffect } from 'react';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  variables: string[];
  thumbnail: string;
  isCustom: boolean;
  usage_count: number;
  rating: number;
}

interface TemplateLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelect: (content: string) => void;
}

export default function TemplateLibrary({ isOpen, onClose, onTemplateSelect }: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [customTemplate, setCustomTemplate] = useState({
    name: '',
    description: '',
    category: 'article',
    content: '',
    variables: [] as string[]
  });
  const [variableInput, setVariableInput] = useState('');

  const categories = [
    { id: 'all', name: 'All Templates' },
    { id: 'article', name: 'Articles' },
    { id: 'blog', name: 'Blog Posts' },
    { id: 'social', name: 'Social Media' },
    { id: 'email', name: 'Email' },
    { id: 'product', name: 'Product Descriptions' },
    { id: 'landing', name: 'Landing Pages' },
    { id: 'press', name: 'Press Releases' },
    { id: 'guide', name: 'How-to Guides' },
    { id: 'review', name: 'Reviews' },
    { id: 'custom', name: 'Custom' }
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, selectedCategory, searchTerm]);

  const loadTemplates = () => {
    // Mock templates - in real implementation, these would be loaded from backend
    const mockTemplates: Template[] = [
      {
        id: '1',
        name: 'Blog Post Introduction',
        description: 'A compelling introduction template for blog posts',
        category: 'blog',
        content: `# {title}

{hook_sentence}

In this article, we'll explore {main_topic} and discover how {benefit}. Whether you're {target_audience_description}, this guide will provide you with {promise_of_value}.

## What You'll Learn
- {learning_point_1}
- {learning_point_2}
- {learning_point_3}

Let's dive in!`,
        variables: ['title', 'hook_sentence', 'main_topic', 'benefit', 'target_audience_description', 'promise_of_value', 'learning_point_1', 'learning_point_2', 'learning_point_3'],
        thumbnail: '',
        isCustom: false,
        usage_count: 245,
        rating: 4.8
      },
      {
        id: '2',
        name: 'Product Description',
        description: 'Professional product description template',
        category: 'product',
        content: `## {product_name}

{product_tagline}

### Key Features
- {feature_1}
- {feature_2}
- {feature_3}

### Why Choose {product_name}?
{main_benefit_paragraph}

### Perfect For
{target_customer_description}

**Price: {price}**

{call_to_action}`,
        variables: ['product_name', 'product_tagline', 'feature_1', 'feature_2', 'feature_3', 'main_benefit_paragraph', 'target_customer_description', 'price', 'call_to_action'],
        thumbnail: '',
        isCustom: false,
        usage_count: 189,
        rating: 4.6
      },
      {
        id: '3',
        name: 'How-To Guide',
        description: 'Step-by-step guide template',
        category: 'guide',
        content: `# How to {task_description}

{introduction_paragraph}

## What You'll Need
- {requirement_1}
- {requirement_2}
- {requirement_3}

## Step-by-Step Instructions

### Step 1: {step_1_title}
{step_1_description}

### Step 2: {step_2_title}
{step_2_description}

### Step 3: {step_3_title}
{step_3_description}

## Tips for Success
- {tip_1}
- {tip_2}
- {tip_3}

## Conclusion
{conclusion_paragraph}`,
        variables: ['task_description', 'introduction_paragraph', 'requirement_1', 'requirement_2', 'requirement_3', 'step_1_title', 'step_1_description', 'step_2_title', 'step_2_description', 'step_3_title', 'step_3_description', 'tip_1', 'tip_2', 'tip_3', 'conclusion_paragraph'],
        thumbnail: '',
        isCustom: false,
        usage_count: 312,
        rating: 4.9
      },
      {
        id: '4',
        name: 'Social Media Post',
        description: 'Engaging social media post template',
        category: 'social',
        content: `{attention_grabber} 

{main_message}

{value_proposition}

{call_to_action}

#hashtag1 #hashtag2 #hashtag3`,
        variables: ['attention_grabber', 'main_message', 'value_proposition', 'call_to_action'],
        thumbnail: '',
        isCustom: false,
        usage_count: 567,
        rating: 4.7
      },
      {
        id: '5',
        name: 'Email Newsletter',
        description: 'Professional newsletter template',
        category: 'email',
        content: `Subject: {email_subject}

Hi {recipient_name},

{personal_greeting}

## {main_headline}

{opening_paragraph}

### {section_1_title}
{section_1_content}

### {section_2_title}
{section_2_content}

{call_to_action}

Best regards,
{sender_name}

{unsubscribe_text}`,
        variables: ['email_subject', 'recipient_name', 'personal_greeting', 'main_headline', 'opening_paragraph', 'section_1_title', 'section_1_content', 'section_2_title', 'section_2_content', 'call_to_action', 'sender_name', 'unsubscribe_text'],
        thumbnail: '',
        isCustom: false,
        usage_count: 198,
        rating: 4.5
      }
    ];

    setTemplates(mockTemplates);
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTemplates(filtered);
  };

  const useTemplate = (template: Template) => {
    setSelectedTemplate(template);
  };

  const applyTemplate = (content: string) => {
    onTemplateSelect(content);
    onClose();
  };

  const saveCustomTemplate = () => {
    if (!customTemplate.name || !customTemplate.content) return;

    const newTemplate: Template = {
      id: Date.now().toString(),
      name: customTemplate.name,
      description: customTemplate.description,
      category: customTemplate.category,
      content: customTemplate.content,
      variables: customTemplate.variables,
      thumbnail: '',
      isCustom: true,
      usage_count: 0,
      rating: 0
    };

    setTemplates([...templates, newTemplate]);
    setCustomTemplate({
      name: '',
      description: '',
      category: 'article',
      content: '',
      variables: []
    });
    setActiveTab('browse');
  };

  const addVariable = () => {
    if (variableInput.trim() && !customTemplate.variables.includes(variableInput.trim())) {
      setCustomTemplate({
        ...customTemplate,
        variables: [...customTemplate.variables, variableInput.trim()]
      });
      setVariableInput('');
    }
  };

  const removeVariable = (variable: string) => {
    setCustomTemplate({
      ...customTemplate,
      variables: customTemplate.variables.filter(v => v !== variable)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Template Library</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {['browse', 'create'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab === 'browse' ? 'Browse Templates' : 'Create Template'}
            </button>
          ))}
        </div>

        {activeTab === 'browse' && (
          <div className="flex h-[calc(90vh-140px)]">
            {/* Sidebar */}
            <div className="w-1/4 border-r p-4">
              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              {/* Categories */}
              <div>
                <h3 className="font-medium text-gray-800 mb-3">Categories</h3>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded ${
                        selectedCategory === category.id
                          ? 'bg-blue-100 text-blue-800'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {selectedTemplate ? (
                /* Template Preview */
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setSelectedTemplate(null)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ← Back to templates
                    </button>
                    <button
                      onClick={() => applyTemplate(selectedTemplate.content)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Use This Template
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {selectedTemplate.name}
                    </h3>
                    <p className="text-gray-600 mb-4">{selectedTemplate.description}</p>
                    
                    <div className="flex items-center space-x-4 mb-6">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {categories.find(c => c.id === selectedTemplate.category)?.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        Used {selectedTemplate.usage_count} times
                      </span>
                      <div className="flex items-center">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm text-gray-600 ml-1">
                          {selectedTemplate.rating}
                        </span>
                      </div>
                    </div>

                    {selectedTemplate.variables.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-800 mb-2">Variables to customize:</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedTemplate.variables.map((variable, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm"
                            >
                              {variable}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Preview:</h4>
                      <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm">
                          {selectedTemplate.content}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Template Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => useTemplate(template)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-800">{template.name}</h3>
                        {template.isCustom && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            Custom
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {template.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="capitalize">{template.category}</span>
                        <div className="flex items-center space-x-2">
                          <span>{template.usage_count} uses</span>
                          <div className="flex items-center">
                            <span className="text-yellow-500">★</span>
                            <span className="ml-1">{template.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <h3 className="text-lg font-semibold mb-6">Create Custom Template</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={customTemplate.name}
                    onChange={(e) => setCustomTemplate({...customTemplate, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Enter template name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={customTemplate.category}
                    onChange={(e) => setCustomTemplate({...customTemplate, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {categories.filter(c => c.id !== 'all').map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={customTemplate.description}
                  onChange={(e) => setCustomTemplate({...customTemplate, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20 resize-none"
                  placeholder="Describe your template"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variables
                </label>
                <div className="flex space-x-2 mb-3">
                  <input
                    type="text"
                    value={variableInput}
                    onChange={(e) => setVariableInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addVariable()}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Add variable name (e.g., title, author)"
                  />
                  <button
                    onClick={addVariable}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {customTemplate.variables.map((variable, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                    >
                      {variable}
                      <button
                        onClick={() => removeVariable(variable)}
                        className="ml-2 text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Content
                </label>
                <textarea
                  value={customTemplate.content}
                  onChange={(e) => setCustomTemplate({...customTemplate, content: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-64 resize-none font-mono text-sm"
                  placeholder="Write your template content here. Use {variable_name} for variables."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use curly braces to mark variables, e.g., {'{title}'}, {'{author}'}
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setActiveTab('browse')}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCustomTemplate}
                  disabled={!customTemplate.name || !customTemplate.content}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
