'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  autoSave?: boolean;
  collaborators?: any[];
  darkMode?: boolean;
  placeholder?: string;
}

interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  cursor_position: number;
  is_typing: boolean;
  color: string;
}

export default function RichTextEditor({
  content,
  onChange,
  onSave,
  autoSave = true,
  collaborators = [],
  darkMode = false,
  placeholder = 'Start writing your content...'
}: RichTextEditorProps) {
  const [editorContent, setEditorContent] = useState(content);
  const [isTyping, setIsTyping] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [selectedText, setSelectedText] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [currentFormat, setCurrentFormat] = useState<string[]>([]);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setEditorContent(content);
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
    updateStats(content);
  }, [content]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && editorContent !== content) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        onChange(editorContent);
      }, 2000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [editorContent, content, onChange, autoSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            execCommand('bold');
            break;
          case 'i':
            e.preventDefault();
            execCommand('italic');
            break;
          case 'u':
            e.preventDefault();
            execCommand('underline');
            break;
          case 'k':
            e.preventDefault();
            handleLinkClick();
            break;
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'z':
            e.preventDefault();
            execCommand('undo');
            break;
          case 'y':
            e.preventDefault();
            execCommand('redo');
            break;
        }
      }
      
      // Heading shortcuts (Ctrl/Cmd + 1, 2, 3, 4, 5, 6)
      if ((e.ctrlKey || e.metaKey) && ['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        e.preventDefault();
        execCommand('formatBlock', `<h${e.key}>`);
      }
      
      // Zen mode toggle (F11)
      if (e.key === 'F11') {
        e.preventDefault();
        setZenMode(!zenMode);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [zenMode, onSave]);

  const updateStats = (text: string) => {
    // Remove HTML tags for word count
    const plainText = text.replace(/<[^>]*>/g, '').trim();
    const words = plainText.split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setReadingTime(Math.ceil(words.length / 200));
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setEditorContent(newContent);
      updateStats(newContent);
      setIsTyping(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    }
  };

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setSelectedText(selection.toString());
    } else {
      setSelectedText('');
    }
    
    // Update current formatting
    updateCurrentFormat();
  }, []);

  const updateCurrentFormat = () => {
    const formats: string[] = [];
    
    if (document.queryCommandState('bold')) formats.push('bold');
    if (document.queryCommandState('italic')) formats.push('italic');
    if (document.queryCommandState('underline')) formats.push('underline');
    if (document.queryCommandState('strikeThrough')) formats.push('strikethrough');
    
    setCurrentFormat(formats);
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleContentChange();
    updateCurrentFormat();
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave();
    }
  };

  const handleLinkClick = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setLinkText(selection.toString());
    }
    setShowLinkDialog(true);
  };

  const insertLink = () => {
    if (linkUrl && linkText) {
      if (selectedText) {
        execCommand('createLink', linkUrl);
      } else {
        const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
        execCommand('insertHTML', linkHtml);
      }
    }
    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');
  };

  const insertImage = () => {
    if (imageUrl) {
      const imgHtml = `<img src="${imageUrl}" alt="${imageAlt}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;" />`;
      execCommand('insertHTML', imgHtml);
    }
    setShowImageDialog(false);
    setImageUrl('');
    setImageAlt('');
  };

  const insertTable = () => {
    const tableHtml = `
      <table style="border-collapse: collapse; width: 100%; margin: 10px 0; border: 1px solid #ddd;">
        <thead>
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5;">Header 1</th>
            <th style="border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5;">Header 2</th>
            <th style="border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5;">Header 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Cell 1</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Cell 2</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Cell 3</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Cell 4</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Cell 5</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Cell 6</td>
          </tr>
        </tbody>
      </table>
    `;
    execCommand('insertHTML', tableHtml);
  };

  const insertCodeBlock = () => {
    const codeHtml = `<pre style="background-color: #f4f4f4; border: 1px solid #ddd; border-radius: 4px; padding: 15px; margin: 10px 0; overflow-x: auto;"><code>// Your code here</code></pre>`;
    execCommand('insertHTML', codeHtml);
  };

  const insertQuote = () => {
    const quoteHtml = `<blockquote style="border-left: 4px solid #ddd; margin: 10px 0; padding: 10px 20px; background-color: #f9f9f9; font-style: italic;">Your quote here</blockquote>`;
    execCommand('insertHTML', quoteHtml);
  };

  const insertHorizontalRule = () => {
    execCommand('insertHorizontalRule');
  };

  const formatTextColor = (color: string) => {
    execCommand('foreColor', color);
  };

  const formatBackgroundColor = (color: string) => {
    execCommand('backColor', color);
  };

  const formatFontSize = (size: string) => {
    execCommand('fontSize', size);
  };

  const formatFontFamily = (family: string) => {
    execCommand('fontName', family);
  };

  const clearFormatting = () => {
    execCommand('removeFormat');
  };

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  return (
    <div className={`rich-text-editor ${darkMode ? 'dark' : ''} ${zenMode ? 'zen-mode' : ''}`}>
      <div className={`${zenMode ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col' : 'border rounded-lg bg-white dark:bg-gray-800'} 
                      ${focusMode ? 'shadow-2xl' : ''}`}>
        
        {/* Toolbar */}
        {!zenMode && (
          <div className="flex flex-wrap items-center justify-between p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 gap-2">
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Undo/Redo */}
              <div className="flex items-center space-x-1 bg-white dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => execCommand('undo')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Undo (Ctrl+Z)"
                >
                  <i className="fas fa-undo text-sm"></i>
                </button>
                <button
                  onClick={() => execCommand('redo')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Redo (Ctrl+Y)"
                >
                  <i className="fas fa-redo text-sm"></i>
                </button>
              </div>

              {/* Basic Formatting */}
              <div className="flex items-center space-x-1 bg-white dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => execCommand('bold')}
                  className={`p-2 rounded transition-colors ${
                    currentFormat.includes('bold') 
                      ? 'bg-blue-200 dark:bg-blue-600' 
                      : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title="Bold (Ctrl+B)"
                >
                  <i className="fas fa-bold text-sm"></i>
                </button>
                <button
                  onClick={() => execCommand('italic')}
                  className={`p-2 rounded transition-colors ${
                    currentFormat.includes('italic') 
                      ? 'bg-blue-200 dark:bg-blue-600' 
                      : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title="Italic (Ctrl+I)"
                >
                  <i className="fas fa-italic text-sm"></i>
                </button>
                <button
                  onClick={() => execCommand('underline')}
                  className={`p-2 rounded transition-colors ${
                    currentFormat.includes('underline') 
                      ? 'bg-blue-200 dark:bg-blue-600' 
                      : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title="Underline (Ctrl+U)"
                >
                  <i className="fas fa-underline text-sm"></i>
                </button>
                <button
                  onClick={() => execCommand('strikeThrough')}
                  className={`p-2 rounded transition-colors ${
                    currentFormat.includes('strikethrough') 
                      ? 'bg-blue-200 dark:bg-blue-600' 
                      : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title="Strikethrough"
                >
                  <i className="fas fa-strikethrough text-sm"></i>
                </button>
              </div>

              {/* Headings */}
              <div className="flex items-center space-x-1 bg-white dark:bg-gray-700 rounded-lg p-1">
                <select
                  onChange={(e) => execCommand('formatBlock', e.target.value)}
                  className="p-1 rounded border-0 bg-transparent text-sm focus:outline-none"
                  title="Text Format"
                >
                  <option value="<div>">Normal</option>
                  <option value="<h1>">Heading 1</option>
                  <option value="<h2>">Heading 2</option>
                  <option value="<h3>">Heading 3</option>
                  <option value="<h4>">Heading 4</option>
                  <option value="<h5>">Heading 5</option>
                  <option value="<h6>">Heading 6</option>
                  <option value="<p>">Paragraph</option>
                </select>
              </div>

              {/* Font Family */}
              <div className="flex items-center space-x-1 bg-white dark:bg-gray-700 rounded-lg p-1">
                <select
                  onChange={(e) => formatFontFamily(e.target.value)}
                  className="p-1 rounded border-0 bg-transparent text-sm focus:outline-none"
                  title="Font Family"
                >
                  <option value="Arial">Arial</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Times New Roman">Times</option>
                  <option value="Courier New">Courier</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Helvetica">Helvetica</option>
                </select>
              </div>

              {/* Font Size */}
              <div className="flex items-center space-x-1 bg-white dark:bg-gray-700 rounded-lg p-1">
                <select
                  onChange={(e) => formatFontSize(e.target.value)}
                  className="p-1 rounded border-0 bg-transparent text-sm focus:outline-none"
                  title="Font Size"
                >
                  <option value="1">Small</option>
                  <option value="2">Normal</option>
                  <option value="3" selected>Medium</option>
                  <option value="4">Large</option>
                  <option value="5">X-Large</option>
                  <option value="6">XX-Large</option>
                </select>
              </div>

              {/* Text Color */}
              <div className="flex items-center space-x-1 bg-white dark:bg-gray-700 rounded-lg p-1">
                <input
                  type="color"
                  onChange={(e) => formatTextColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                  title="Text Color"
                />
                <input
                  type="color"
                  onChange={(e) => formatBackgroundColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                  title="Background Color"
                />
              </div>

              {/* Alignment */}
              <div className="flex items-center space-x-1 bg-white dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => execCommand('justifyLeft')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Align Left"
                >
                  <i className="fas fa-align-left text-sm"></i>
                </button>
                <button
                  onClick={() => execCommand('justifyCenter')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Center"
                >
                  <i className="fas fa-align-center text-sm"></i>
                </button>
                <button
                  onClick={() => execCommand('justifyRight')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Align Right"
                >
                  <i className="fas fa-align-right text-sm"></i>
                </button>
                <button
                  onClick={() => execCommand('justifyFull')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Justify"
                >
                  <i className="fas fa-align-justify text-sm"></i>
                </button>
              </div>

              {/* Lists */}
              <div className="flex items-center space-x-1 bg-white dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => execCommand('insertUnorderedList')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Bullet List"
                >
                  <i className="fas fa-list-ul text-sm"></i>
                </button>
                <button
                  onClick={() => execCommand('insertOrderedList')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Numbered List"
                >
                  <i className="fas fa-list-ol text-sm"></i>
                </button>
                <button
                  onClick={() => execCommand('outdent')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Decrease Indent"
                >
                  <i className="fas fa-outdent text-sm"></i>
                </button>
                <button
                  onClick={() => execCommand('indent')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Increase Indent"
                >
                  <i className="fas fa-indent text-sm"></i>
                </button>
              </div>

              {/* Insert Content */}
              <div className="flex items-center space-x-1 bg-white dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={handleLinkClick}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Insert Link (Ctrl+K)"
                >
                  <i className="fas fa-link text-sm"></i>
                </button>
                <button
                  onClick={() => setShowImageDialog(true)}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Insert Image"
                >
                  <i className="fas fa-image text-sm"></i>
                </button>
                <button
                  onClick={insertTable}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Insert Table"
                >
                  <i className="fas fa-table text-sm"></i>
                </button>
                <button
                  onClick={insertCodeBlock}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Code Block"
                >
                  <i className="fas fa-code text-sm"></i>
                </button>
                <button
                  onClick={insertQuote}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Quote"
                >
                  <i className="fas fa-quote-left text-sm"></i>
                </button>
                <button
                  onClick={insertHorizontalRule}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Horizontal Rule"
                >
                  <i className="fas fa-minus text-sm"></i>
                </button>
              </div>

              {/* Clear Formatting */}
              <div className="flex items-center space-x-1 bg-white dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={clearFormatting}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Clear Formatting"
                >
                  <i className="fas fa-eraser text-sm"></i>
                </button>
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-2">
              {/* Focus Mode */}
              <button
                onClick={() => setFocusMode(!focusMode)}
                className={`p-2 rounded transition-colors ${
                  focusMode ? 'bg-blue-200 dark:bg-blue-600' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Focus Mode"
              >
                <i className="fas fa-crosshairs text-sm"></i>
              </button>

              {/* Zen Mode */}
              <button
                onClick={() => setZenMode(!zenMode)}
                className={`p-2 rounded transition-colors ${
                  zenMode ? 'bg-blue-200 dark:bg-blue-600' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Zen Mode (F11)"
              >
                <i className="fas fa-expand text-sm"></i>
              </button>

              {/* Save */}
              <button
                onClick={handleSave}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                title="Save (Ctrl+S)"
              >
                <i className="fas fa-save text-sm mr-1"></i>
                Save
              </button>
            </div>
          </div>
        )}

        {/* Zen mode toolbar */}
        {zenMode && (
          <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-10">
            <button
              onClick={() => setZenMode(false)}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Exit Zen Mode"
            >
              <i className="fas fa-compress text-sm"></i>
            </button>
          </div>
        )}

        {/* Editor Content */}
        <div className={`flex-1 ${zenMode ? 'flex items-center justify-center p-8' : ''}`}>
          <div
            ref={editorRef}
            contentEditable
            onInput={handleContentChange}
            onKeyUp={updateCurrentFormat}
            onMouseUp={updateCurrentFormat}
            className={`
              rich-text-content outline-none p-4 min-h-96 text-gray-800 dark:text-gray-200
              ${zenMode ? 'max-w-4xl w-full mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8' : ''}
              ${focusMode ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
            `}
            style={{
              lineHeight: '1.6',
              fontSize: '16px',
              fontFamily: 'Arial, sans-serif'
            }}
            suppressContentEditableWarning={true}
            data-placeholder={placeholder}
          />
        </div>

        {/* Status Bar */}
        {!zenMode && (
          <div className="flex items-center justify-between p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span>{wordCount} words</span>
              <span>{readingTime} min read</span>
              {isTyping && (
                <span className="flex items-center gap-1 text-blue-500">
                  <i className="fas fa-circle animate-pulse" style={{fontSize: '6px'}}></i>
                  Typing...
                </span>
              )}
              {autoSave && (
                <span className="text-green-500">
                  <i className="fas fa-check text-xs mr-1"></i>
                  Auto-save enabled
                </span>
              )}
            </div>

            {/* Collaborators */}
            {collaborators.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs">Collaborators:</span>
                <div className="flex -space-x-1">
                  {collaborators.slice(0, 3).map((collaborator: Collaborator) => (
                    <div
                      key={collaborator.id}
                      className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center border-2 border-white dark:border-gray-800"
                      title={collaborator.name}
                      style={{backgroundColor: collaborator.color}}
                    >
                      {collaborator.avatar}
                    </div>
                  ))}
                  {collaborators.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-gray-500 text-white text-xs flex items-center justify-center border-2 border-white dark:border-gray-800">
                      +{collaborators.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Insert Link</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Link Text</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full p-2 border rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter link text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full p-2 border rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowLinkDialog(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={insertLink}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={!linkUrl || !linkText}
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Dialog */}
      {showImageDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Insert Image</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-2 border rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Alt Text</label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="w-full p-2 border rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Describe the image"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowImageDialog(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={insertImage}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={!imageUrl}
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .rich-text-content[data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        .rich-text-content h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
        }
        
        .rich-text-content h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.75em 0;
        }
        
        .rich-text-content h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.83em 0;
        }
        
        .rich-text-content h4 {
          font-size: 1em;
          font-weight: bold;
          margin: 1.12em 0;
        }
        
        .rich-text-content h5 {
          font-size: 0.83em;
          font-weight: bold;
          margin: 1.5em 0;
        }
        
        .rich-text-content h6 {
          font-size: 0.75em;
          font-weight: bold;
          margin: 1.67em 0;
        }
        
        .rich-text-content p {
          margin: 1em 0;
        }
        
        .rich-text-content ul, .rich-text-content ol {
          margin: 1em 0;
          padding-left: 40px;
        }
        
        .rich-text-content blockquote {
          margin: 1em 0;
          padding: 0 40px;
        }
        
        .rich-text-content a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        .rich-text-content a:hover {
          color: #1d4ed8;
        }
        
        .zen-mode .rich-text-content {
          font-size: 18px;
          line-height: 1.8;
        }
      `}</style>
    </div>
  );
}
