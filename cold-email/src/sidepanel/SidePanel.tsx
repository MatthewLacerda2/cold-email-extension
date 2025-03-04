import { useState, useEffect } from 'react'
import { fetchWebpageContent } from '../contentScript/r_jina_ai'
import { generateEmailFromWebpage } from '../contentScript/gemini'
import './SidePanel.css'

interface PageMetadata {
  title: string;
  description: string;
  keywords: string[];
}

export const SidePanel = () => {
  const [content, setContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [loadingStatus, setLoadingStatus] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState<boolean>(false)
  const [editableContent, setEditableContent] = useState<string>('')
  const [isEditMode, setIsEditMode] = useState<boolean>(true)
  const [metadata, setMetadata] = useState<PageMetadata>({
    title: '',
    description: '',
    keywords: []
  })

  const formatEmailContent = (text: string) => {
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    const signaturePatterns = [
      /Sincerely,[\s\S]*$/i,
      /Best regards,[\s\S]*$/i,
      /Regards,[\s\S]*$/i,
      /Best,[\s\S]*$/i,
      /Yours truly,[\s\S]*$/i,
      /Thank you,[\s\S]*$/i
    ];
    
    for (const pattern of signaturePatterns) {
      if (pattern.test(formattedText)) {
        formattedText = formattedText.replace(pattern, match => {
          const greeting = match.split(/\r?\n/)[0];
          return `${greeting} Nilg.AI`;
        });
        break; // Stop after first match
      }
    }
    
    return formattedText;
  };

  useEffect(() => {
    if (content) {
      // Convert HTML to plain text for editing
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = formatEmailContent(content);
      setEditableContent(tempDiv.textContent || tempDiv.innerText || '');
    }
  }, [content]);

  const copyToClipboard = () => {
    // Use the edited content if available
    navigator.clipboard.writeText(editableContent)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  // Handle content changes in the editable area
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableContent(e.target.value);
  };

  const fetchContent = async () => {
    setIsLoading(true)
    setLoadingStatus('Reading the page...')
    setError(null)
    
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      const currentTab = tabs[0]
      const currentUrl = currentTab?.url
      
      if (currentUrl) {
        setMetadata({
          title: currentTab.title || 'No title available',
          description: '',
          keywords: []
        })
        
        // Get page description and keywords by executing script in the tab
        if (currentTab.id) {
          try {
            const results = await chrome.scripting.executeScript({
              target: { tabId: currentTab.id },
              func: () => {
                const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || 
                                       document.querySelector('meta[property="og:description"]')?.getAttribute('content') || 
                                       '';
                
                const metaKeywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';
                const keywords = metaKeywords.split(',').map(k => k.trim()).filter(Boolean);
                
                return {
                  description: metaDescription,
                  keywords: keywords
                };
              }
            });
            
            if (results && results[0]?.result) {
              const data = results[0].result as { description: string, keywords: string[] };
              setMetadata(prev => ({
                ...prev,
                description: data.description,
                keywords: data.keywords
              }));
            }
          } catch (scriptError) {
            console.warn('Could not execute script to get metadata:', scriptError);
          }
        }
        
        // Fetch the content using Jina
        const pageContent = await fetchWebpageContent(currentUrl)
        
        // Now generate email with Gemini
        setLoadingStatus('Google Gemini is thinking...')
        const generatedEmail = await generateEmailFromWebpage(
          metadata.title,
          metadata.description,
          pageContent
        )
        
        setContent(generatedEmail)
      } else {
        setError('No active tab found')
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`)
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
      setLoadingStatus('')
    }
  }

  useEffect(() => {
    fetchContent()
  }, [])

  return (
    <main className="content-viewer">
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '10px', 
        justifyContent: 'space-between',
        height: '40px' // Fixed height container to ensure alignment
      }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <button 
            onClick={fetchContent} 
            className="reload-button"
            title="Reload content from current page"
            style={{ 
              marginRight: '10px', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              fontSize: '26px',
              color: '#FF8C00',
              display: 'flex',
              alignItems: 'center',
              padding: '0',
              height: '100%' // Match parent height
            }}
          >
            ⟳
          </button>
          <h3 className="app-title" style={{ 
            margin: '0', 
            display: 'flex', 
            alignItems: 'center',
            height: '100%' // Match parent height
          }}>
            <strong>Cold Email Generator</strong>
          </h3>
        </div>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          title={isEditMode ? "Switch to preview mode" : "Switch to edit mode"}
          style={{
            background: 'none',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '12px',
            color: isEditMode ? '#4a90e2' : '#666',
            height: '28px', // Fixed height for the button
            alignSelf: 'center' // Center vertically in the parent container
          }}
        >
          {isEditMode ? "Preview" : "Edit"}
        </button>
      </div>
      
      {isLoading && (
        <div className="loading">
          <div className="loading-spinner"></div>
          <div className="loading-text">{loadingStatus}</div>
          <p></p>
        </div>
      )}      
      {error && <div className="error">{error}</div>}      
      {!isLoading && !error && (
        <div className="content-container">
          <div className="content-header" style={{ display: 'flex', alignItems: 'center' }}>
            <div className="content-label">Generated Email:</div>
            <button 
              className="copy-button" 
              onClick={copyToClipboard}
              title="Copy to clipboard"
            >
              {copySuccess ? '✓' : '📋'}
            </button>
          </div>
          {isEditMode ? (
            <textarea
              className="editable-email"
              value={editableContent}
              onChange={handleContentChange}
              rows={15}
              style={{ resize: 'none' }}
            />
          ) : (
            <div 
              className="formatted-email"
              dangerouslySetInnerHTML={{ __html: formatEmailContent(content) }}
            />
          )}
        </div>
      )}
    </main>
  )
}

export default SidePanel
