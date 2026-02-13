'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2, XCircle, Key, Sparkles, AlertTriangle, Building2 } from 'lucide-react';
import { LLM_PROVIDERS, LLMProviderType, getModelsForProvider } from '@/src/llm/providers';

interface LLMSettings {
  providerType: LLMProviderType;
  modelDefault: string;
  baseUrl: string | null;
  validationStatus: string;
  lastValidatedAt: string | null;
  maskedApiKey: string;
}

interface TelecomProvider {
  id: string;
  slug: string;
  displayName: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  
  const [hasApiKey, setHasApiKey] = useState(false);
  const [settings, setSettings] = useState<LLMSettings | null>(null);
  
  // Form state
  const [providerType, setProviderType] = useState<LLMProviderType>('OPENAI');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4-turbo-preview');
  const [baseUrl, setBaseUrl] = useState('');

  // My Company state
  const [telecomProviders, setTelecomProviders] = useState<TelecomProvider[]>([]);
  const [focusProviderId, setFocusProviderId] = useState<string>('none');
  const [savingFocus, setSavingFocus] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchProviders();
    fetchFocusProvider();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings/llm');
      const data = await res.json();
      
      if (data.settings) {
        setSettings(data.settings);
        setProviderType(data.settings.providerType);
        setModel(data.settings.modelDefault);
        setBaseUrl(data.settings.baseUrl || '');
        setHasApiKey(data.hasApiKey);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProviders() {
    try {
      const res = await fetch('/api/providers');
      const data = await res.json();
      setTelecomProviders(data.providers || []);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    }
  }

  async function fetchFocusProvider() {
    try {
      const res = await fetch('/api/user/focus-provider');
      const data = await res.json();
      if (data.focusProvider) {
        setFocusProviderId(data.focusProvider.id);
      } else {
        setFocusProviderId('none');
      }
    } catch (error) {
      console.error('Failed to fetch focus provider:', error);
    }
  }

  async function handleSaveFocusProvider() {
    setSavingFocus(true);
    try {
      const actualId = focusProviderId === 'none' ? null : focusProviderId;
      const res = await fetch('/api/user/focus-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: actualId }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast({
        title: 'Company Set',
        description: focusProviderId ? 'Your company has been updated for competitive analysis.' : 'Company selection cleared.',
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save company setting', variant: 'destructive' });
    } finally {
      setSavingFocus(false);
    }
  }

  async function handleSave() {
    if (!apiKey && !hasApiKey) {
      toast({
        title: 'API Key Required',
        description: 'Please enter your API key',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    
    try {
      const res = await fetch('/api/settings/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerType,
          apiKey: apiKey || 'unchanged',
          modelDefault: model,
          baseUrl: baseUrl || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setSettings(data.settings);
      setHasApiKey(true);
      setApiKey(''); // Clear the input after saving
      
      toast({
        title: 'Settings Saved',
        description: 'Your LLM settings have been updated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    
    try {
      const res = await fetch('/api/settings/llm/test', {
        method: 'POST',
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: 'Connection Successful',
          description: data.message,
        });
        // Refresh settings to get updated validation status
        fetchSettings();
      } else {
        toast({
          title: 'Connection Failed',
          description: data.error || 'Could not connect to the LLM provider',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test connection',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  }

  const selectedProvider = LLM_PROVIDERS.find((p) => p.type === providerType);
  const availableModels = getModelsForProvider(providerType);

  // Update model when provider changes
  useEffect(() => {
    if (availableModels.length > 0 && !availableModels.find((m) => m.id === model)) {
      setModel(availableModels[0].id);
    }
  }, [providerType, availableModels, model]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Shared configuration — changes here apply to all users
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>LLM Provider Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure the shared AI provider for all users. API key and model are shared app-wide — any user can update them, and all analysis will use these settings.
            The API key is encrypted and stored securely.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Current Status */}
          {settings && (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50">
              <div className="flex-1">
                <p className="font-medium">Current Configuration</p>
                <p className="text-sm text-muted-foreground">
                  {selectedProvider?.name} - {model}
                </p>
              </div>
              {settings.validationStatus === 'valid' && (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </Badge>
              )}
              {settings.validationStatus === 'invalid' && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  Invalid
                </Badge>
              )}
              {settings.validationStatus === 'pending' && (
                <Badge variant="warning" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Not Tested
                </Badge>
              )}
            </div>
          )}

          <Separator />

          {/* Provider Selection */}
          <div className="space-y-2">
            <Label>LLM Provider</Label>
            <Select value={providerType} onValueChange={(v) => setProviderType(v as LLMProviderType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {LLM_PROVIDERS.map((provider) => (
                  <SelectItem key={provider.type} value={provider.type}>
                    <div className="flex flex-col">
                      <span>{provider.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProvider && (
              <p className="text-sm text-muted-foreground">{selectedProvider.description}</p>
            )}
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">
              API Key
              {hasApiKey && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (Current: {settings?.maskedApiKey})
                </span>
              )}
            </Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="apiKey"
                type="password"
                placeholder={hasApiKey ? 'Enter new key to update' : 'Enter your API key'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your API key is encrypted before storage and never logged.
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex flex-col">
                      <span>{m.name}</span>
                      {m.description && (
                        <span className="text-xs text-muted-foreground">{m.description}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Base URL for OpenAI-Compatible */}
          {providerType === 'OPENAI_COMPATIBLE' && (
            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                type="url"
                placeholder="https://api.example.com/v1"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The base URL of your OpenAI-compatible API endpoint
              </p>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
            
            {hasApiKey && (
              <Button variant="outline" onClick={handleTest} disabled={testing}>
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* My Company / Competitive Framing */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>My Company</CardTitle>
          </div>
          <CardDescription>
            Select the focus company for competitive intelligence. This setting is shared across all users — executive summaries and strategic analysis will be framed from this provider&apos;s perspective.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Company / Provider</Label>
            <Select value={focusProviderId} onValueChange={setFocusProviderId}>
              <SelectTrigger>
                <SelectValue placeholder="Select your company..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (neutral analysis)</SelectItem>
                {telecomProviders.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              When set, competitive intelligence and executive summaries will be framed from this provider&apos;s perspective.
            </p>
          </div>
          <Button onClick={handleSaveFocusProvider} disabled={savingFocus}>
            {savingFocus ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Company'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800 text-lg">Why configure an LLM?</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700 space-y-2">
          <p>
            An LLM provider enables powerful features in SMB Market Intelligence:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Intelligent extraction of plan details from provider pages</li>
            <li>Automatic summarization of complex service offerings</li>
            <li>Natural language comparison narratives</li>
            <li>Feature inference and normalization across providers</li>
          </ul>
          <p className="text-xs mt-3 pt-2 border-t border-blue-200">
            All settings (API key, model, company) are shared across all users. Any user can configure them once, and everyone benefits.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
