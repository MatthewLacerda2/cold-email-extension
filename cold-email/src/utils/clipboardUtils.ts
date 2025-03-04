/**
 * Utility functions for clipboard operations
 */

/**
 * Copies text to clipboard and returns a promise that resolves when the operation is complete
 * 
 * @param text - The text to copy to clipboard
 * @returns A Promise that resolves when the text is copied or rejects with an error
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    return Promise.resolve();
  } catch (err) {
    console.error('Failed to copy: ', err);
    return Promise.reject(err);
  }
}; 