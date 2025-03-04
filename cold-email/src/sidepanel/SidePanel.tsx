import { useState, useEffect } from 'react'
import { fetchWebpageContent } from '../contentScript/r_jina_ai'
import { generateEmailFromWebpage } from '../contentScript/gemini'
import { 
  formatEmailContent, 
  htmlToPlainText, 
  copyToClipboard, 
  getActiveTab, 
  extractPageMetadata,
  PageMetadata 
} from '../utils'
import './SidePanel.css'

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

  useEffect(() => {
    if (content) {
      // Convert HTML to plain text for editing
      setEditableContent(htmlToPlainText(formatEmailContent(content)));
    }
  }, [content]);

  const handleCopyToClipboard = () => {
    // Use the edited content if available
    copyToClipboard(editableContent)
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
      const currentTab = await getActiveTab();
      const currentUrl = currentTab?.url;
      
      if (currentUrl && currentTab) {
        setMetadata({
          title: currentTab.title || 'No title available',
          description: '',
          keywords: []
        })
        
        // Get page description and keywords by executing script in the tab
        if (currentTab.id) {
          try {
            const metadataResult = await extractPageMetadata(currentTab.id);
            
            setMetadata(prev => ({
              ...prev,
              description: metadataResult.description,
              keywords: metadataResult.keywords
            }));
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
              onClick={handleCopyToClipboard}
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
              dangerouslySetInnerHTML={{ __html: formatEmailContent(editableContent) }}
            />
          )}
        </div>
      )}
    </main>
  )
}

export default SidePanel
