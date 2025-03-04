import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

const API_KEY = "AIzaSyCatIMZ3sWGamEC6dKF7FIIrulBZeGGgO4";
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Generates an email based on webpage content using Google's Gemini AI
 * 
 * @param title - The title of the webpage
 * @param description - The meta description of the webpage
 * @param content - The cleaned content of the webpage in LLM-readable format
 * @returns A Promise that resolves to the generated email text
 */
export async function generateEmailFromWebpage(
  title: string,
  description: string,
  content: string
): Promise<string> {
  try {
    const model: GenerativeModel = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-thinking-exp-01-21"
    });

    const prompt = `
    You are an assistant that writes cold-emails on behalf of Nilg.AI
      - Nilg.AI helps companies implement AI roadmaps that drive value proposition.
      - We provide AI Training and AI Development services.
    
    Write a compelling cold-email for the company that owns the following website:
    WEBPAGE TITLE: ${title}
    WEBPAGE DESCRIPTION: ${description}
    WEBPAGE CONTENT: ${content.substring(0, 16000)}
    
    The email should:
    1. Introduce Nilg.AI briefly. Who we are, what we do
      - Write it in the first person, as if you are the one writing the email
      - Do not say your name or title, just say you are from Nilg.AI
    2. Be concise, compelling, and tailored for the recipient
      - Write in the language/idiom of the webpage
    3. Lists up to 10 things the recipient could use AI for
        - Use the content of the webpage to list things the recipient could use AI for
    4. Ends with a clear call for an appointment scheduling and information for contact:
        - Email: info@nilg.ai
        - Phone: +351 220 731 377
        - Website: https://nilg.ai/
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const emailText = response.text();
    
    return emailText;
  } catch (error) {
    console.error("Error generating email with Gemini:", error);
    throw new Error(`Failed to generate email: ${error instanceof Error ? error.message : String(error)}`);
  }
}