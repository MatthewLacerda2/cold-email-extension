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
  const [metadata, setMetadata] = useState<PageMetadata>({
    title: '',
    description: '',
    keywords: []
  })

  // Function to format the email content with bold text and standardize signature
  const formatEmailContent = (text: string) => {
    // Replace text between double asterisks with bold text
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Replace signature with "Nilg.AI"
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
          // Get just the greeting part (e.g., "Sincerely,")
          const greeting = match.split(/\r?\n/)[0];
          return `${greeting}\nNilg.AI`;
        });
        break; // Stop after first match
      }
    }
    
    return formattedText;
  };

  useEffect(() => {
    // Get the URL of the current active tab when the panel opens
    const fetchContent = async () => {
      setIsLoading(true)
      setLoadingStatus('Waiting for Jina...')
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
          
          // Fetch the content using Jina
          const pageContent = await fetchWebpageContent(currentUrl)
          
          // Now generate email with Gemini
          setLoadingStatus('Waiting for Gemini...')
          const generatedEmail = await generateEmailFromWebpage(
            metadata.title,
            metadata.description,
            pageContent
          )
          
          // Set the generated email as content
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

    fetchContent()
  }, [])

  return (
    <main className="content-viewer">
      <h3 className="app-title">Cold Email Generator</h3>      
      {isLoading && (
        <div className="loading">
          <div className="loading-spinner"></div>
          <div className="loading-text">{loadingStatus}</div>
        </div>
      )}      
      {error && <div className="error">{error}</div>}      
      {!isLoading && !error && (
        <div className="content-container">
          <div className="content-label">Generated Email:</div>
          <div 
            className="formatted-email"
            dangerouslySetInnerHTML={{ __html: formatEmailContent(content) }}
          />
        </div>
      )}
    </main>
  )
}

export default SidePanel
