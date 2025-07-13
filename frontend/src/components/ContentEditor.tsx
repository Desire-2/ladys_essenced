'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface ContentEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  autoSave?: boolean;
  collaborators?: any[];
  darkMode?: boolean;
}

interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  cursor_position: number;
  is_typing: boolean;
  color: string;
}

interface Comment {
  id: string;
  author: string;
  text: string;
  position: number;
  timestamp: string;
  resolved: boolean;
}

export default function ContentEditor({
  content,
  onChange,
  onSave,
  autoSave = true,
  collaborators = [],
  darkMode = false
}: ContentEditorProps) {
  const [editorContent, setEditorContent] = useState(content);
  const [isTyping, setIsTyping] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedText, setSelectedText] = useState('');
  const [showFormatting, setShowFormatting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [activeComment, setActiveComment] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  const [typewriterMode, setTypewriterMode] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setEditorContent(content);
    updateStats(content);
  }, [content]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            applyFormatting('bold');
            break;
          case 'i':
            e.preventDefault();
            applyFormatting('italic');
            break;
          case 'u':
            e.preventDefault();
            applyFormatting('underline');
            break;
          case 'k':
            e.preventDefault();
            applyFormatting('link');
            break;
          case 's':
            e.preventDefault();
            if (onSave) onSave();
            break;
          case '/':
            e.preventDefault();
            applyFormatting('code');
            break;
          case '.':
            e.preventDefault();
            applyFormatting('quote');
            break;
        }
      }
      
      // Heading shortcuts (Ctrl/Cmd + 1, 2, 3)
      if ((e.ctrlKey || e.metaKey) && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        applyFormatting(`heading${e.key}`);
      }
      
      // Zen mode toggle (F11)
      if (e.key === 'F11') {
        e.preventDefault();
        setZenMode(!zenMode);
      }
    };

    if (editorRef.current) {
      editorRef.current.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [content, zenMode, onSave]);

  useEffect(() => {
    if (autoSave && editorContent !== content) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        onChange(editorContent);
        if (onSave) onSave();
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [editorContent, content, onChange, onSave, autoSave]);

  const updateStats = (text: string) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setReadingTime(Math.ceil(words.length / 200)); // Average reading speed: 200 words per minute
  };

  const handleContentChange = (newContent: string) => {
    setEditorContent(newContent);
    updateStats(newContent);
    setIsTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleCursorChange = useCallback(() => {
    if (editorRef.current) {
      setCursorPosition(editorRef.current.selectionStart);
      
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        setSelectedText(selection.toString());
      } else {
        setSelectedText('');
      }
    }
  }, []);

  const applyFormatting = (format: string) => {
    if (!editorRef.current) return;

    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    const selectedText = editorContent.substring(start, end);
    
    let formattedText = '';
    let newCursorPos = start;
    
    switch (format) {
      case 'bold':
        formattedText = selectedText ? `**${selectedText}**` : '**bold text**';
        newCursorPos = start + (selectedText ? 2 : 2);
        break;
      case 'italic':
        formattedText = selectedText ? `*${selectedText}*` : '*italic text*';
        newCursorPos = start + (selectedText ? 1 : 1);
        break;
      case 'code':
        formattedText = selectedText ? `\`${selectedText}\`` : '`code`';
        newCursorPos = start + (selectedText ? 1 : 1);
        break;
      case 'quote':
        const lines = (selectedText || 'quote text').split('\n');
        formattedText = lines.map(line => `> ${line}`).join('\n');
        newCursorPos = start + 2;
        break;
      case 'link':
        formattedText = selectedText ? `[${selectedText}](https://example.com)` : '[link text](https://example.com)';
        newCursorPos = start + (selectedText ? selectedText.length + 3 : 11);
        break;
      case 'heading1':
        formattedText = selectedText ? `# ${selectedText}` : '# Heading 1';
        newCursorPos = start + 2;
        break;
      case 'heading2':
        formattedText = selectedText ? `## ${selectedText}` : '## Heading 2';
        newCursorPos = start + 3;
        break;
      case 'heading3':
        formattedText = selectedText ? `### ${selectedText}` : '### Heading 3';
        newCursorPos = start + 4;
        break;
      case 'list':
        const listLines = (selectedText || 'list item').split('\n');
        formattedText = listLines.map(line => `- ${line}`).join('\n');
        newCursorPos = start + 2;
        break;
      case 'numbered':
        const numberedLines = (selectedText || 'numbered item').split('\n');
        formattedText = numberedLines.map((line, index) => `${index + 1}. ${line}`).join('\n');
        newCursorPos = start + 3;
        break;
      case 'strikethrough':
        formattedText = selectedText ? `~~${selectedText}~~` : '~~strikethrough~~';
        newCursorPos = start + (selectedText ? 2 : 2);
        break;
      case 'underline':
        formattedText = selectedText ? `<u>${selectedText}</u>` : '<u>underlined text</u>';
        newCursorPos = start + (selectedText ? 3 : 3);
        break;
      case 'table':
        formattedText = `| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |`;
        newCursorPos = start;
        break;
      case 'hr':
        formattedText = '\n---\n';
        newCursorPos = start + 5;
        break;
      default:
        formattedText = selectedText;
    }

    const newContent = editorContent.substring(0, start) + formattedText + editorContent.substring(end);
    handleContentChange(newContent);
    
    // Restore cursor position
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        const endPos = selectedText ? start + formattedText.length : newCursorPos;
        editorRef.current.setSelectionRange(newCursorPos, endPos);
      }
    }, 0);
  };

  const addComment = () => {
    if (!newComment.trim() || !selectedText) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: 'Current User', // In real app, get from auth context
      text: newComment,
      position: cursorPosition,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    setComments([...comments, comment]);
    setNewComment('');
    setActiveComment(null);
  };

  const resolveComment = (commentId: string) => {
    setComments(comments.map(comment =>
      comment.id === commentId ? { ...comment, resolved: true } : comment
    ));
  };

  const toggleMode = (mode: 'focus' | 'typewriter' | 'zen') => {
    switch (mode) {
      case 'focus':
        setFocusMode(!focusMode);
        break;
      case 'typewriter':
        setTypewriterMode(!typewriterMode);
        break;
      case 'zen':
        setZenMode(!zenMode);
        break;
    }
  };

  return (
    <div className={`relative ${darkMode ? 'dark' : ''}`}>
      <div className={`${zenMode ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : 'border rounded-lg'} 
                      ${focusMode ? 'shadow-2xl' : ''}`}>
        
        {/* Toolbar */}
        {!zenMode && (
          <div className="flex flex-wrap items-center justify-between p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* Basic Formatting */}
              <div className="flex items-center space-x-1 bg-white dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => applyFormatting('bold')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Bold (Ctrl+B)"
                >
                  <strong className="text-sm">B</strong>
                </button>
                <button
                  onClick={() => applyFormatting('italic')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors italic"
                  title="Italic (Ctrl+I)"
                >
                  <span className="text-sm">I</span>
                </button>
                <button
                  onClick={() => applyFormatting('underline')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors underline"
                  title="Underline (Ctrl+U)"
                >
                  <span className="text-sm">U</span>
                </button>
                <button
                  onClick={() => applyFormatting('strikethrough')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors line-through"
                  title="Strikethrough"
                >
                  <span className="text-sm">S</span>
                </button>
                <button
                  onClick={() => applyFormatting('code')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-mono"
                  title="Code"
                >
                  <span className="text-xs">{'</>'}</span>
                </button>
              </div>

              {/* Headings */}
              <div className="flex items-center space-x-1 bg-white dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => applyFormatting('heading1')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-bold text-lg"
                  title="Heading 1"
                >
                  H1
                </button>
                <button
                  onClick={() => applyFormatting('heading2')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-semibold"
                  title="Heading 2"
                >
                  H2
                </button>
                <button
                  onClick={() => applyFormatting('heading3')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Heading 3"
                >
                  H3
                </button>
              </div>

              {/* Lists and Content */}
              <div className="flex items-center space-x-1 bg-white dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => applyFormatting('list')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Bullet List"
                >
                  <span className="text-lg">•</span>
                </button>
                <button
                  onClick={() => applyFormatting('numbered')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Numbered List"
                >
                  <span className="text-sm">1.</span>
                </button>
                <button
                  onClick={() => applyFormatting('quote')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Quote"
                >
                  <span className="text-sm">❝❞</span>
                </button>
                <button
                  onClick={() => applyFormatting('link')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Link"
                >
                  🔗
                </button>
              </div>

              {/* Advanced Formatting */}
              <div className="flex items-center space-x-1 bg-white dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => applyFormatting('table')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Insert Table"
                >
                  📊
                </button>
                <button
                  onClick={() => applyFormatting('hr')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Horizontal Rule"
                >
                  ➖
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Mode Toggles */}
              <div className="flex items-center space-x-1 bg-white dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => toggleMode('focus')}
                  className={`p-2 rounded transition-colors ${focusMode ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  title="Focus Mode"
                >
                  🎯
                </button>
                <button
                  onClick={() => toggleMode('typewriter')}
                  className={`p-2 rounded transition-colors ${typewriterMode ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  title="Typewriter Mode"
                >
                  ⌨️
                </button>
                <button
                  onClick={() => toggleMode('zen')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Zen Mode (Distraction-free)"
                >
                  🧘
                </button>
              </div>

              {/* Comments */}
              <button
                onClick={() => setShowComments(!showComments)}
                className={`p-2 rounded transition-colors relative ${showComments ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300' : 'hover:bg-gray-200 dark:hover:bg-gray-600 bg-white dark:bg-gray-700'}`}
                title="Comments"
              >
                💬 
                {comments.filter(c => !c.resolved).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {comments.filter(c => !c.resolved).length}
                  </span>
                )}
              </button>

              {/* Save Button */}
              {onSave && (
                <button
                  onClick={onSave}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  title="Save Content (Ctrl+S)"
                >
                  💾 Save
                </button>
              )}

              {/* Collaborators */}
              {collaborators.length > 0 && (
                <div className="flex items-center space-x-1">
                  {collaborators.slice(0, 3).map((collaborator, index) => (
                    <div
                      key={collaborator.id}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white shadow-sm"
                      style={{ backgroundColor: collaborator.color }}
                      title={`${collaborator.name}${collaborator.is_typing ? ' (typing...)' : ''}`}
                    >
                      {collaborator.name.charAt(0).toUpperCase()}
                      {collaborator.is_typing && (
                        <span className="absolute w-2 h-2 bg-green-400 rounded-full animate-pulse -bottom-0 -right-0"></span>
                      )}
                    </div>
                  ))}
                  {collaborators.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-xs text-white">
                      +{collaborators.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex">
          {/* Main Editor */}
          <div className={`flex-1 relative ${focusMode ? 'bg-gray-50 dark:bg-gray-900' : ''}`}>
            <textarea
              ref={editorRef}
              value={editorContent}
              onChange={(e) => handleContentChange(e.target.value)}
              onSelect={handleCursorChange}
              onKeyUp={handleCursorChange}
              onClick={handleCursorChange}
              className={`w-full h-96 p-4 border-none resize-none focus:outline-none dark:bg-gray-900 dark:text-white transition-all duration-200
                         ${typewriterMode ? 'font-mono' : 'font-sans'}
                         ${focusMode ? 'text-lg leading-relaxed shadow-inner' : 'text-base'}
                         ${zenMode ? 'h-screen text-xl leading-relaxed p-8 bg-white dark:bg-gray-900' : ''}
                         placeholder:text-gray-400 dark:placeholder:text-gray-500`}
              placeholder="Start writing your content... 

Use markdown formatting:
• **bold** or *italic* 
• # Heading 1, ## Heading 2
• [link text](url)
• > quote
• - bullet points
• 1. numbered lists

Keyboard shortcuts:
• Ctrl+B for bold
• Ctrl+I for italic  
• Ctrl+K for link
• Ctrl+S to save
• F11 for zen mode"
              style={{
                lineHeight: typewriterMode ? '2.2' : zenMode ? '1.8' : '1.6',
                fontSize: zenMode ? '18px' : focusMode ? '16px' : '14px',
                fontFamily: typewriterMode ? 'Monaco, Consolas, "Courier New", monospace' : 'inherit'
              }}
              spellCheck={true}
              autoComplete="off"
              autoCorrect="on"
              wrap="soft"
            />
            
            {/* Character/Word limit indicator */}
            {editorContent.length > 8000 && (
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded">
                {editorContent.length > 10000 ? 'Very long content' : 'Long content'}
              </div>
            )}
            
            {/* Focus mode overlay */}
            {focusMode && !zenMode && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-gray-100 dark:from-gray-800 to-transparent opacity-50"></div>
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gray-100 dark:from-gray-800 to-transparent opacity-50"></div>
              </div>
            )}
          </div>

          {/* Comments Sidebar */}
          {showComments && !zenMode && (
            <div className="w-80 border-l p-4 bg-gray-50 dark:bg-gray-800 overflow-y-auto max-h-96">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold dark:text-white">Comments</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {comments.filter(c => !c.resolved).length} active
                  </span>
                  <button
                    onClick={() => setShowComments(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              {/* Add Comment */}
              {selectedText && (
                <div className="mb-4 p-3 border rounded-lg bg-white dark:bg-gray-700 shadow-sm">
                  <div className="flex items-start space-x-2 mb-2">
                    <span className="text-blue-600 dark:text-blue-400 text-sm">💭</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 font-medium">
                        Add comment to selection:
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 p-2 rounded italic mb-2">
                        "{selectedText.substring(0, 100)}{selectedText.length > 100 ? '...' : ''}"
                      </p>
                    </div>
                  </div>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write your comment here..."
                    className="w-full p-2 border rounded text-sm resize-none dark:bg-gray-600 dark:text-white dark:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={() => {
                        setNewComment('');
                        setActiveComment(null);
                      }}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addComment}
                      disabled={!newComment.trim()}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Add Comment
                    </button>
                  </div>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-3">
                {comments
                  .filter(comment => !comment.resolved)
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((comment) => (
                    <div key={comment.id} className="p-3 border rounded-lg bg-white dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {comment.author.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-sm dark:text-white">{comment.author}</span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(comment.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">{comment.text}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Position: {comment.position}
                        </span>
                        <button
                          onClick={() => resolveComment(comment.id)}
                          className="text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-medium transition-colors"
                        >
                          ✓ Resolve
                        </button>
                      </div>
                    </div>
                  ))}

                {comments.filter(c => !c.resolved).length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 dark:text-gray-500 mb-2">
                      💬
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No active comments
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                      Select text to add a comment
                    </p>
                  </div>
                )}

                {/* Resolved Comments */}
                {comments.filter(c => c.resolved).length > 0 && (
                  <details className="mt-6">
                    <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                      {comments.filter(c => c.resolved).length} resolved comments
                    </summary>
                    <div className="mt-2 space-y-2">
                      {comments
                        .filter(comment => comment.resolved)
                        .map((comment) => (
                          <div key={comment.id} className="p-2 border rounded bg-gray-100 dark:bg-gray-600 opacity-75">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium dark:text-white">{comment.author}</span>
                              <span className="text-xs text-gray-500">✓ Resolved</span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300">{comment.text}</p>
                          </div>
                        ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        {!zenMode && (
          <div className="flex flex-wrap items-center justify-between p-3 border-t text-sm text-gray-600 dark:text-gray-400 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 gap-2">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-1">
                <span className="font-medium">{wordCount}</span>
                <span>words</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-medium">{readingTime}</span>
                <span>min read</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>Characters:</span>
                <span className="font-medium">{editorContent.length}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>Position:</span>
                <span className="font-medium">{cursorPosition}</span>
              </div>
              {selectedText && (
                <div className="flex items-center space-x-1 text-blue-600">
                  <span>Selected:</span>
                  <span className="font-medium">{selectedText.length} chars</span>
                </div>
              )}
              {isTyping && (
                <div className="flex items-center space-x-1 text-green-600 animate-pulse">
                  <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                  <span>Typing...</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {autoSave && (
                <div className="flex items-center space-x-1 text-green-600">
                  <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                  <span>Auto-save</span>
                </div>
              )}
              {collaborators.some(c => c.is_typing) && (
                <div className="flex items-center space-x-1 text-blue-600 animate-pulse">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  <span>
                    {collaborators.filter(c => c.is_typing).map(c => c.name).join(', ')} typing...
                  </span>
                </div>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Press F11 for Zen mode • Ctrl+S to save
              </div>
            </div>
          </div>
        )}

        {/* Zen Mode Exit */}
        {zenMode && (
          <button
            onClick={() => setZenMode(false)}
            className="fixed top-4 right-4 p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 z-10"
            title="Exit Zen Mode"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
