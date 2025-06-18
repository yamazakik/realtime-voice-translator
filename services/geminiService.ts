
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AIModel } from "../components/ModelSelector";

// デフォルトのAPIキー（後方互換性のため）
const DEFAULT_API_KEY = process.env.GEMINI_API_KEY;

export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage: string,
  selectedModelId?: string
): Promise<string> {
  if (!text.trim()) {
    return "";
  }

  // モデル設定を取得
  const savedModels = localStorage.getItem('aiModels');
  let models: AIModel[] = [];
  
  if (savedModels) {
    models = JSON.parse(savedModels);
  } else {
    // デフォルトモデル
    models = [{
      id: 'gemini-default',
      name: 'Gemini Flash (デフォルト)',
      apiKey: DEFAULT_API_KEY || '',
      modelName: 'gemini-2.5-flash-preview-05-20',
      provider: 'gemini'
    }];
  }

  const selectedModel = models.find(m => m.id === selectedModelId) || models[0];
  
  if (!selectedModel) {
    throw new Error("利用可能なAIモデルが設定されていません。");
  }

  const prompt = `あなたはプロの翻訳家です。以下の${sourceLanguage}のテキストを${targetLanguage}に翻訳してください。翻訳結果の${targetLanguage}のテキストのみを返してください。説明、前置き、後書き、またはその他の会話的な要素は一切含めないでください。\n\n${sourceLanguage}テキスト:\n${text}`;

  try {
    switch (selectedModel.provider) {
      case 'gemini':
        return await translateWithGemini(selectedModel, prompt);
      case 'openai':
        return await translateWithOpenAI(selectedModel, prompt);
      case 'anthropic':
        return await translateWithAnthropic(selectedModel, prompt);
      case 'custom':
        return await translateWithCustom(selectedModel, prompt);
      default:
        throw new Error(`サポートされていないプロバイダー: ${selectedModel.provider}`);
    }
  } catch (error: any) {
    console.error("翻訳APIエラー:", error);
    let errorMessage = `翻訳APIエラー: ${error.message || "不明なエラー"}`;
    
    if (error.message && error.message.toLowerCase().includes("api key not valid")) {
      errorMessage = "APIキーが無効のようです。モデル設定を確認してください。";
    } else if (error.message && error.message.toLowerCase().includes("quota")) {
      errorMessage = "APIの利用制限を超過しました。しばらく待ってから再試行してください。";
    } else if (error.message && error.message.toLowerCase().includes("candidate was blocked")) {
      errorMessage = "翻訳リクエストがコンテンツポリシーによりブロックされました。入力内容を確認してください。";
    }
    
    throw new Error(errorMessage);
  }
}

async function translateWithGemini(model: AIModel, prompt: string): Promise<string> {
  if (!model.apiKey) {
    throw new Error("Gemini APIキーが設定されていません。");
  }

  const ai = new GoogleGenAI({ apiKey: model.apiKey });
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: model.modelName,
    contents: prompt,
  });

  const translatedText = response.text;
  
  if (typeof translatedText !== "string") {
    throw new Error("翻訳APIから予期しない形式のレスポンスを受け取りました。");
  }

  return translatedText.trim();
}

async function translateWithOpenAI(model: AIModel, prompt: string): Promise<string> {
  if (!model.apiKey) {
    throw new Error("OpenAI APIキーが設定されていません。");
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${model.apiKey}`
    },
    body: JSON.stringify({
      model: model.modelName,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content?.trim() || '';
}

async function translateWithAnthropic(model: AIModel, prompt: string): Promise<string> {
  if (!model.apiKey) {
    throw new Error("Anthropic APIキーが設定されていません。");
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': model.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model.modelName,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Anthropic API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0]?.text?.trim() || '';
}

async function translateWithCustom(model: AIModel, prompt: string): Promise<string> {
  if (!model.apiKey) {
    throw new Error("カスタムAPIキーが設定されていません。");
  }

  if (!model.endpoint) {
    throw new Error("カスタムエンドポイントが設定されていません。");
  }

  const response = await fetch(model.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${model.apiKey}`
    },
    body: JSON.stringify({
      model: model.modelName,
      prompt: prompt,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    throw new Error(`Custom API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.response || data.text || data.content || '';
}
