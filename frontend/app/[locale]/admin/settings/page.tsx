'use client';

import { useState, useEffect } from 'react';
import { settingsAPI } from '@/lib/api';

export default function AdminSettingsPage() {
  const [supportTelegram, setSupportTelegram] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await settingsAPI.getPublicSettings();
      setSupportTelegram(data.supportTelegram || '');
    } catch (error) {
      console.error('Failed to load settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await settingsAPI.updateSetting('support_telegram', supportTelegram);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to save settings'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-serif font-bold text-accent-gold mb-8">
          Settings
        </h1>

        {message && (
          <div
            className={`mb-6 p-4 rounded ${
              message.type === 'success'
                ? 'bg-green-900/50 text-green-200 border border-green-700'
                : 'bg-red-900/50 text-red-200 border border-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="card-noir">
          <h2 className="text-2xl font-bold text-accent-purple mb-6">
            Contact Information
          </h2>

          <div className="mb-6">
            <label className="block text-gray-300 mb-2">
              Support Telegram Link
            </label>
            <input
              type="url"
              value={supportTelegram}
              onChange={(e) => setSupportTelegram(e.target.value)}
              placeholder="https://t.me/yoursupport"
              className="input-noir w-full"
            />
            <p className="text-sm text-gray-500 mt-2">
              This link will be displayed in the footer for users to conta
              ct support.
              <br />
              Example: https://t.me/yourusername or https://t.me/+yourgroup
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
