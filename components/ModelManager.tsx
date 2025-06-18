
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { AIModel } from './ModelSelector';

interface ModelManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onModelUpdate: () => void;
}

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${className}`}>
    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
  </svg>
);

export const ModelManager: React.FC<ModelManagerProps> = ({ isOpen, onClose, onModelUpdate }) => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedModels = localStorage.getItem('aiModels');
      if (savedModels) {
        setModels(JSON.parse(savedModels));
      }
    }
  }, [isOpen]);

  const saveModels = (updatedModels: AIModel[]) => {
    setModels(updatedModels);
    localStorage.setItem('aiModels', JSON.stringify(updatedModels));
    onModelUpdate();
  };

  const handleAddModel = () => {
    const newModel: AIModel = {
      id: `model-${Date.now()}`,
      name: '',
      apiKey: '',
      modelName: '',
      provider: 'gemini'
    };
    setEditingModel(newModel);
    setIsAddingNew(true);
  };

  const handleSaveModel = () => {
    if (!editingModel || !editingModel.name || !editingModel.modelName) return;

    if (isAddingNew) {
      saveModels([...models, editingModel]);
    } else {
      saveModels(models.map(m => m.id === editingModel.id ? editingModel : m));
    }
    setEditingModel(null);
    setIsAddingNew(false);
  };

  const handleDeleteModel = (modelId: string) => {
    if (models.length <= 1) {
      alert('最低1つのモデルは必要です。');
      return;
    }
    saveModels(models.filter(m => m.id !== modelId));
  };

  const handleCancel = () => {
    setEditingModel(null);
    setIsAddingNew(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-100">AIモデル管理</h2>
          <Button onClick={onClose} variant="secondary" className="p-2">
            <CloseIcon />
          </Button>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-200">登録済みモデル</h3>
            <Button onClick={handleAddModel} variant="primary" className="flex items-center">
              <PlusIcon className="mr-2" />
              新しいモデルを追加
            </Button>
          </div>

          <div className="space-y-4">
            {models.map(model => (
              <div key={model.id} className="bg-slate-700 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-100">{model.name}</h4>
                    <p className="text-sm text-slate-300">プロバイダー: {model.provider}</p>
                    <p className="text-sm text-slate-300">モデル: {model.modelName}</p>
                    <p className="text-sm text-slate-400">
                      APIキー: {
                        model.apiKey ? '設定済み' : 
                        (model.provider === 'gemini' && model.id === 'gemini-default') ? 'Replit Secretsを使用' : 
                        '未設定'
                      }
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => setEditingModel(model)}
                      variant="secondary"
                      className="text-sm"
                    >
                      編集
                    </Button>
                    <Button 
                      onClick={() => handleDeleteModel(model.id)}
                      variant="secondary"
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {editingModel && (
            <div className="mt-6 bg-slate-700 rounded-lg p-4">
              <h4 className="font-semibold text-slate-100 mb-4">
                {isAddingNew ? '新しいモデルを追加' : 'モデルを編集'}
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    モデル名
                  </label>
                  <input
                    type="text"
                    value={editingModel.name}
                    onChange={(e) => setEditingModel({...editingModel, name: e.target.value})}
                    className="w-full bg-slate-600 text-slate-100 rounded px-3 py-2 border border-slate-500 focus:border-indigo-500 focus:outline-none"
                    placeholder="例: GPT-4 Turbo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    プロバイダー
                  </label>
                  <select
                    value={editingModel.provider}
                    onChange={(e) => setEditingModel({...editingModel, provider: e.target.value as AIModel['provider']})}
                    className="w-full bg-slate-600 text-slate-100 rounded px-3 py-2 border border-slate-500 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic Claude</option>
                    <option value="custom">カスタム</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    モデル名（API用）
                  </label>
                  <input
                    type="text"
                    value={editingModel.modelName}
                    onChange={(e) => setEditingModel({...editingModel, modelName: e.target.value})}
                    className="w-full bg-slate-600 text-slate-100 rounded px-3 py-2 border border-slate-500 focus:border-indigo-500 focus:outline-none"
                    placeholder="例: gemini-2.5-flash-preview-05-20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    APIキー
                  </label>
                  <input
                    type="password"
                    value={editingModel.apiKey}
                    onChange={(e) => setEditingModel({...editingModel, apiKey: e.target.value})}
                    className="w-full bg-slate-600 text-slate-100 rounded px-3 py-2 border border-slate-500 focus:border-indigo-500 focus:outline-none"
                    placeholder="APIキーを入力"
                  />
                </div>

                {editingModel.provider === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      エンドポイントURL（オプション）
                    </label>
                    <input
                      type="url"
                      value={editingModel.endpoint || ''}
                      onChange={(e) => setEditingModel({...editingModel, endpoint: e.target.value})}
                      className="w-full bg-slate-600 text-slate-100 rounded px-3 py-2 border border-slate-500 focus:border-indigo-500 focus:outline-none"
                      placeholder="https://api.example.com/v1"
                    />
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <Button onClick={handleSaveModel} variant="primary">
                    保存
                  </Button>
                  <Button onClick={handleCancel} variant="secondary">
                    キャンセル
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
