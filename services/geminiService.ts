
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.error("Gemini APIキーが環境変数に設定されていません。process.env.API_KEYを確認してください。");
}

export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage: string
): Promise<string> {
  if (!ai) {
    throw new Error("Gemini APIクライアントが初期化されていません。APIキーを確認してください。");
  }
  if (!text.trim()) {
    return "";
  }

  const prompt = `あなたはプロの翻訳家です。以下の${sourceLanguage}のテキストを${targetLanguage}に翻訳してください。翻訳結果の${targetLanguage}のテキストのみを返してください。説明、前置き、後書き、またはその他の会話的な要素は一切含めないでください。\n\n${sourceLanguage}テキスト:\n${text}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17', // Corrected model name
        contents: prompt,
    });
    
    const translatedText = response.text;

    if (typeof translatedText !== 'string') {
        throw new Error("翻訳APIから予期しない形式のレスポンスを受け取りました。");
    }
    
    return translatedText.trim();

  } catch (error: any) {
    console.error("Gemini APIエラー:", error);
    let errorMessage = `翻訳APIエラー: ${error.message || "不明なエラー"}`;
    if (error.message && error.message.toLowerCase().includes("api key not valid")) {
        errorMessage = "Gemini APIキーが無効のようです。設定を確認してください。";
    } else if (error.message && error.message.toLowerCase().includes("quota")) {
        errorMessage = "Gemini APIの利用制限を超過しました。しばらく待ってから再試行してください。";
    } else if (error.message && error.message.toLowerCase().includes("candidate was blocked")) {
        errorMessage = "翻訳リクエストがコンテンツポリシーによりブロックされました。入力内容を確認してください。";
    }
    throw new Error(errorMessage);
  }
}
