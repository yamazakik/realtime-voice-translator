
import React, { useState, useEffect } from 'react';
import { Button } from './Button';

export interface AIModel {
  id: string;
  name: string;
  apiKey: string;
  endpoint?: string;
  modelName: string;
  provider: 'gemini' | 'openai' | 'anthropic' | 'custom';
}

interface ModelSelectorProps {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  onModelManage: () => void;
}

const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M11.828 2.25c-.916 0-1.699.663-1.85 1.567l-.091.549a.798.798 0 0 1-.517.608 7.45 7.45 0 0 0-.478.198.798.798 0 0 1-.796-.064l-.453-.324a1.875 1.875 0 0 0-2.416.2l-.243.243a1.875 1.875 0 0 0-.2 2.416l.324.453a.798.798 0 0 1 .064.796 7.448 7.448 0 0 0-.198.478.798.798 0 0 1-.608.517l-.549.091A1.875 1.875 0 0 0 2.25 11.828v.344c0 .916.663 1.699 1.567 1.85l.549.091c.281.047.504.25.608.517.06.162.127.321.198.478a.798.798 0 0 1-.064.796l-.324.453a1.875 1.875 0 0 0 .2 2.416l.243.243c.648.648 1.67.733 2.416.2l.453-.324a.798.798 0 0 1 .796-.064c.157.071.316.137.478.198.267.104.47.327.517.608l.091.549a1.875 1.875 0 0 0 1.85 1.567h.344c.916 0 1.699-.663 1.85-1.567l.091-.549a.798.798 0 0 1 .517-.608 7.52 7.52 0 0 0 .478-.198.798.798 0 0 1 .796.064l.453.324a1.875 1.875 0 0 0 2.416-.2l.243-.243c.648-.648.733-1.67.2-2.416l-.324-.453a.798.798 0 0 1-.064-.796c.071-.157.137-.316.198-.478.104-.267.327-.47.608-.517l.549-.091A1.875 1.875 0 0 0 21.75 12.172v-.344c0-.916-.663-1.699-1.567-1.85l-.549-.091a.798.798 0 0 1-.608-.517 7.507 7.507 0 0 0-.198-.478.798.798 0 0 1 .064-.796l.324-.453a1.875 1.875 0 0 0-.2-2.416l-.243-.243a1.875 1.875 0 0 0-2.416-.2l-.453.324a.798.798 0 0 1-.796.064 7.462 7.462 0 0 0-.478-.198.798.798 0 0 1-.517-.608l-.091-.549A1.875 1.875 0 0 0 12.172 2.25h-.344ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clipRule="evenodd" />
  </svg>
);

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModelId,
  onModelChange,
  onModelManage
}) => {
  const [models, setModels] = useState<AIModel[]>([]);

  useEffect(() => {
    const savedModels = localStorage.getItem('aiModels');
    if (savedModels) {
      setModels(JSON.parse(savedModels));
    } else {
      // デフォルトモデル
      const defaultModels: AIModel[] = [
        {
          id: 'gemini-default',
          name: 'Gemini Flash (デフォルト)',
          apiKey: '',
          modelName: 'gemini-2.5-flash-preview-05-20',
          provider: 'gemini'
        }
      ];
      setModels(defaultModels);
      localStorage.setItem('aiModels', JSON.stringify(defaultModels));
    }
  }, []);

  const selectedModel = models.find(m => m.id === selectedModelId);

  return (
    <div className="flex items-center space-x-2 bg-slate-800/60 rounded-lg p-3">
      <span className="text-slate-300 font-medium text-sm">AIモデル:</span>
      <select 
        value={selectedModelId}
        onChange={(e) => onModelChange(e.target.value)}
        className="bg-slate-700 text-slate-200 rounded px-3 py-1 border border-slate-600 focus:border-indigo-500 focus:outline-none text-sm"
      >
        {models.map(model => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
      <Button 
        onClick={onModelManage}
        className="p-1.5" 
        variant="secondary"
        aria-label="モデル設定"
      >
        <SettingsIcon />
      </Button>
    </div>
  );
};
