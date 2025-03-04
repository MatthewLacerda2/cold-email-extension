/**
 * Utility functions for text formatting and manipulation
 */

/**
 * Formats email content by converting markdown-style bold syntax to HTML
 * and standardizing email signatures
 * 
 * @param text - The email text to format
 * @returns Formatted email text with HTML formatting
 */
export const formatEmailContent = (text: string): string => {
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

/**
 * Converts HTML formatted text to plain text
 * 
 * @param htmlText - The HTML text to convert
 * @returns Plain text version of the input
 */
export const htmlToPlainText = (htmlText: string): string => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlText;
  return tempDiv.textContent || tempDiv.innerText || '';
}; 