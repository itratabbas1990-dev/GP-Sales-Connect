
import { GoogleGenAI, Type } from "@google/genai";
import { VisitData, ProductLine, User } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeShopImage = async (base64Images: string[]): Promise<{ description: string; products: ProductLine[]; stockEstimate: number; shelfShare: number; skuCount: number }> => {
  try {
    const prompt = `
      You are an expert AI auditor for Golden Pearl Cosmetics. 
      Analyze these shop shelf images (potentially multiple angles of the same or extended shelf) with extreme precision for Golden Pearl branding only.
      
      STRICT BRAND VERIFICATION RULES:
      1. ONLY identify products as 'Golden Pearl' if you clearly see the "Golden Pearl" script logo or its distinct gold-themed packaging.
      2. IGNORE competitors like Fair & Lovely, Olivia, or local unbranded creams even if the packaging is similar.
      3. If a product looks like a cream but does not have the "Golden Pearl" name, DO NOT COUNT IT.
      
      PRODUCT CATEGORIES TO IDENTIFY:
      - Beauty Cream, Soap, Fairness Cream, White beauty Cream, Face Washes, Body Spray, SunBlock, Lotions, Body Lotions.
      
      TASKS:
      1. Consolidate findings across ALL provided images.
      2. Identify which of these 9 Golden Pearl categories are visible across all frames.
      3. Count total distinct Golden Pearl SKUs across all sections.
      4. Estimate overall Stock Level (0-100%) based on our 108 SKU target range.
      5. Estimate total Shelf Share: Average percentage of total shelf space owned strictly by Golden Pearl across the captured areas.
      6. Provide a 2-sentence professional observation about our brand's visibility compared to competitors.

      RETURN JSON ONLY.
    `;

    // Map each base64 string to a Gemini part
    const imageParts = base64Images.map(base64 => ({
      inlineData: { mimeType: 'image/jpeg', data: base64 }
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          ...imageParts,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            products: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            stockEstimate: { type: Type.NUMBER },
            shelfShare: { type: Type.NUMBER },
            skuCount: { type: Type.NUMBER }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response from AI");
  } catch (error) {
    console.error("Error analyzing images:", error);
    return {
      description: "Could not analyze images. Please verify Golden Pearl stock manually.",
      products: [],
      stockEstimate: 0,
      shelfShare: 0,
      skuCount: 0
    };
  }
};

export const generateDailySummary = async (visits: VisitData[], user?: User | null): Promise<string> => {
  if (visits.length === 0) return "No visits recorded today.";

  const visitsJson = JSON.stringify(visits.map(v => ({
    shop: v.shopName,
    owner: v.shopkeeperName,
    area: v.location,
    products: v.productsAvailable,
    stock: v.stockLevel,
    share: v.shelfShare,
    observation: v.aiInsight
  })));

  const userInfo = user ? `Author: ${user.name}, ${user.role} (${user.city})` : "Author: ASM";

  const prompt = `
    You are a Senior Sales Manager at Golden Pearl Cosmetics.
    ${userInfo}
    Write a concise summary based on these visits:
    ${visitsJson}
    
    Structure:
    1. Overall market sentiment in ${user?.city || 'the area'}.
    2. Category-wise availability highlights.
    3. Action items for supply chain or POSM teams.
    
    Use plain text only with line breaks. No markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Unable to generate summary.";
  } catch (error) {
    return "Summary generation failed.";
  }
};
