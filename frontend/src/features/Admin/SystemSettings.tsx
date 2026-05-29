import React, { useState, useEffect } from 'react';
import { Bot, Save, Loader2 } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '../../components/ui';

export default function SystemSettings() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [provider, setProvider] = useState('openai');
    const [openaiKey, setOpenaiKey] = useState('');
    const [geminiKey, setGeminiKey] = useState('');
    const [claudeKey, setClaudeKey] = useState('');

    useEffect(() => {
        loadAiSettings();
    }, []);

    const loadAiSettings = async () => {
        try {
            const keys = ['AI_PROVIDER', 'OPENAI_API_KEY', 'GEMINI_API_KEY', 'CLAUDE_API_KEY'];
            const results = await Promise.all(keys.map(k => settingsService.getSetting(k)));
            
            const providerSetting = results[0];
            const openAiSetting = results[1];
            const geminiSetting = results[2];
            const claudeSetting = results[3];

            if (providerSetting && providerSetting.value) setProvider(providerSetting.value);
            if (openAiSetting && openAiSetting.value) setOpenaiKey(openAiSetting.value);
            if (geminiSetting && geminiSetting.value) setGeminiKey(geminiSetting.value);
            if (claudeSetting && claudeSetting.value) setClaudeKey(claudeSetting.value);
        } catch (error) {
            console.error('Failed to load AI settings', error);
        }
    };

    const handleSaveAiSettings = async () => {
        try {
            setLoading(true);
            await settingsService.updateSetting('AI_PROVIDER', provider);
            await settingsService.updateSetting('OPENAI_API_KEY', openaiKey);
            await settingsService.updateSetting('GEMINI_API_KEY', geminiKey);
            await settingsService.updateSetting('CLAUDE_API_KEY', claudeKey);
            showToast('AI Settings saved successfully', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to save AI settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="System Settings"
                description="Manage global application settings and integrations"
            />

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-blue-500" />
                            AI Bot Configuration
                        </CardTitle>
                        <CardDescription>
                            Configure your preferred AI provider and corresponding API keys for the ITAM Assistant Bot.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4 max-w-md">
                            <div className="space-y-2">
                                <Label htmlFor="provider">Active AI Provider</Label>
                                <select
                                    id="provider"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={provider}
                                    onChange={(e) => setProvider(e.target.value)}
                                >
                                    <option value="openai">OpenAI (GPT-4o-mini)</option>
                                    <option value="gemini">Google Gemini (1.5 Flash)</option>
                                    <option value="claude">Anthropic Claude (3.5 Sonnet)</option>
                                </select>
                            </div>

                            {provider === 'openai' && (
                                <div className="space-y-2">
                                    <Label htmlFor="openai_key">OpenAI API Key</Label>
                                    <Input
                                        id="openai_key"
                                        type="password"
                                        placeholder="sk-proj-..."
                                        value={openaiKey}
                                        onChange={(e) => setOpenaiKey(e.target.value)}
                                    />
                                </div>
                            )}

                            {provider === 'gemini' && (
                                <div className="space-y-2">
                                    <Label htmlFor="gemini_key">Gemini API Key</Label>
                                    <Input
                                        id="gemini_key"
                                        type="password"
                                        placeholder="AIzaSy..."
                                        value={geminiKey}
                                        onChange={(e) => setGeminiKey(e.target.value)}
                                    />
                                </div>
                            )}

                            {provider === 'claude' && (
                                <div className="space-y-2">
                                    <Label htmlFor="claude_key">Anthropic Claude API Key</Label>
                                    <Input
                                        id="claude_key"
                                        type="password"
                                        placeholder="sk-ant-api..."
                                        value={claudeKey}
                                        onChange={(e) => setClaudeKey(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex pt-2">
                            <Button onClick={handleSaveAiSettings} disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Save AI Settings
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
