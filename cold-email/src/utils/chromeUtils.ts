/**
 * Utility functions for Chrome extension API operations
 */

export interface PageMetadata {
  title: string;
  description: string;
  keywords: string[];
}

/**
 * Gets the currently active tab
 * 
 * @returns A Promise that resolves to the active tab or null if none found
 */
export const getActiveTab = async (): Promise<chrome.tabs.Tab | null> => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
};

/**
 * Extracts metadata from the current webpage
 * 
 * @param tabId - The ID of the tab to extract metadata from
 * @returns A Promise that resolves to the extracted metadata
 */
export const extractPageMetadata = async (tabId: number): Promise<{ description: string, keywords: string[] }> => {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
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
      return results[0].result as { description: string, keywords: string[] };
    }
    
    return { description: '', keywords: [] };
  } catch (error) {
    console.warn('Could not execute script to get metadata:', error);
    return { description: '', keywords: [] };
  }
}; 