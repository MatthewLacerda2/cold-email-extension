/**
 * Fetches the content of a webpage in a format optimized for LLMs using r.jina.ai service
 * @param url The URL of the webpage to fetch content from
 * @returns A Promise that resolves to the formatted webpage content as a string
 */
export async function fetchWebpageContent(url: string): Promise<string> {
  try {
    const encodedUrl = encodeURIComponent(url);
    const jinaUrl = `https://r.jina.ai/${encodedUrl}`;
    
    const response = await fetch(jinaUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
    }
    
    let content = await response.text();
    
    const imageRegex = /!\[Image[^\]]*\]\([^)]*\)/g;
    content = content.replace(imageRegex, (match) => {
      
      const descriptionMatch = match.match(/!\[(Image[^\]]*)\]/);
      if (descriptionMatch && descriptionMatch[1]) {
        return `![${descriptionMatch[1]}]`;
      }
      return match;
    });
    
    return content;
  } catch (error) {
    console.error('Error fetching webpage content:', error);
    throw error;
  }
}