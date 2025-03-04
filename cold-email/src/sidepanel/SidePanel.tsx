import { useState, useEffect } from 'react'
import { fetchWebpageContent } from '../contentScript/r_jina_ai'
import './SidePanel.css'

interface PageMetadata {
  title: string;
  description: string;
  keywords: string[];
}

export const SidePanel = () => {
  const [content, setContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<PageMetadata>({
    title: '',
    description: '',
    keywords: []
  })

  useEffect(() => {
    // Get the URL of the current active tab when the panel opens
    const fetchContent = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Get the current active tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        const currentTab = tabs[0]
        const currentUrl = currentTab?.url
        
        if (currentUrl) {
          // Get tab metadata
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
                  // Try to get meta description
                  const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || 
                                         document.querySelector('meta[property="og:description"]')?.getAttribute('content') || 
                                         '';
                  
                  // Try to get keywords
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
          
          // Fetch the content using our function
          const pageContent = await fetchWebpageContent(currentUrl)
          setContent(pageContent)
        } else {
          setError('No active tab found')
        }
      } catch (err) {
        setError(`Error fetching content: ${err instanceof Error ? err.message : String(err)}`)
        console.error('Error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchContent()
  }, [])

  return (
    <main className="content-viewer">
      <h3>Webpage Content</h3>
      
      <div className="metadata-section">
        <div className="metadata-item">
          <span className="metadata-label">Title:</span>
          <span className="metadata-value">{metadata.title}</span>
        </div>
        
        {metadata.description && (
          <div className="metadata-item">
            <span className="metadata-label">Description:</span>
            <span className="metadata-value">{metadata.description}</span>
          </div>
        )}
        
        {metadata.keywords.length > 0 && (
          <div className="metadata-item">
            <span className="metadata-label">Keywords:</span>
            <span className="metadata-value">{metadata.keywords.join(', ')}</span>
          </div>
        )}
      </div>
      
      {isLoading && <div className="loading">Loading content...</div>}
      
      {error && <div className="error">{error}</div>}
      
      {!isLoading && !error && (
        <div className="content-container">
          <div className="content-label">Content:</div>
          <pre className="content-display">{content}</pre>
        </div>
      )}
    </main>
  )
}

export default SidePanel
