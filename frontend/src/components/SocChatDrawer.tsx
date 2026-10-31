import React, { useState, useEffect } from 'react';
import {
  X, Users, MessageSquare, Send, Code, ShieldCheck,
  UserPlus, UserCheck, Copy, Check, Terminal, AlertCircle,
  Hash, User, Flame, Laptop
} from 'lucide-react';
import { api } from '../api';
import { Analyst, ChatMessage, SocTeamResponse } from '../types';

interface SocChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: 'Senior Analyst' | 'Junior Analyst';
  onSwitchRole?: (role: 'Senior Analyst' | 'Junior Analyst') => void;
}

export const SocChatDrawer: React.FC<SocChatDrawerProps> = ({
  isOpen,
  onClose,
  currentRole,
  onSwitchRole
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'team'>('chat');
  const [chatChannel, setChatChannel] = useState<'general' | 'dm'>('general');
  const [selectedJuniorId, setSelectedJuniorId] = useState<string>('junior-analyst-01');

  // Team state
  const [team, setTeam] = useState<SocTeamResponse | null>(null);
  const [newAnalystName, setNewAnalystName] = useState('');
  const [newAnalystEmail, setNewAnalystEmail] = useState('');
  const [newAnalystSpec, setNewAnalystSpec] = useState('Vulnerability Triage & IOC Ingestion');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSharingCode, setIsSharingCode] = useState(false);
  const [codeSnippetTitle, setCodeSnippetTitle] = useState('');
  const [codeSnippetText, setCodeSnippetText] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('bash');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTeam = async () => {
    const res = await api.getSocTeam();
    setTeam(res);
  };

  const fetchMessages = async () => {
    const res = await api.getSocChat(
      chatChannel,
      chatChannel === 'dm' ? selectedJuniorId : undefined
    );
    setMessages(res);
  };

  useEffect(() => {
    if (isOpen) {
      fetchTeam();
      fetchMessages();
    }
  }, [isOpen, chatChannel, selectedJuniorId]);

  if (!isOpen) return null;

  const handleSendMessage = async () => {
    if (!inputText.trim() && !codeSnippetText.trim()) return;

    const payload: Partial<ChatMessage> = {
      channel: chatChannel,
      senderId: currentRole === 'Senior Analyst' ? 'senior-lead-01' : 'junior-analyst-01',
      senderName: currentRole === 'Senior Analyst' ? 'Rohit Patil' : 'Alice Zhang',
      senderRole: currentRole,
      recipientId: chatChannel === 'dm' ? selectedJuniorId : undefined,
      text: inputText.trim()
    };

    if (isSharingCode && codeSnippetText.trim()) {
      payload.codeSnippet = {
        language: codeLanguage,
        description: codeSnippetTitle || 'Firewall Mitigation Rule',
        code: codeSnippetText.trim()
      };
    }

    try {
      const newMsg = await api.sendSocChatMessage(payload);
      setMessages(prev => [...prev, newMsg]);
      setInputText('');
      setCodeSnippetText('');
      setCodeSnippetTitle('');
      setIsSharingCode(false);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleInviteJunior = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);

    if (!newAnalystName.trim() || !newAnalystEmail.trim()) {
      setInviteError('Please provide analyst full name and email address.');
      return;
    }

    try {
      await api.inviteJuniorAnalyst({
        name: newAnalystName.trim(),
        email: newAnalystEmail.trim(),
        specialization: newAnalystSpec
      });
      setInviteSuccess(`Successfully provisioned Junior Analyst: ${newAnalystName}`);
      setNewAnalystName('');
      setNewAnalystEmail('');
      fetchTeam();
    } catch (err: any) {
      setInviteError(err.message || 'Failed to add Junior Analyst');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const juniorCount = team?.junior_analysts?.length || 0;
  const isMaxJuniors = juniorCount >= 3;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end transition-opacity duration-300">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full border-l border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white shadow-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">SOC Collaboration Center</h3>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {currentRole}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Team Threat Coordination, Code Sharing & Direct Dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'chat'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>SOC Live Chat ({messages.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'team'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Analyst Roster ({juniorCount}/3 Juniors)</span>
          </button>
        </div>

        {/* Tab 1: Live Chat */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Channel / DM Selector */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setChatChannel('general')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1.5 ${
                    chatChannel === 'general'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Hash className="w-3.5 h-3.5" />
                  <span>#general-soc</span>
                </button>
                <button
                  onClick={() => setChatChannel('dm')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1.5 ${
                    chatChannel === 'dm'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>1-on-1 DM</span>
                </button>
              </div>

              {chatChannel === 'dm' && (
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs text-slate-500">With:</span>
                  <select
                    value={selectedJuniorId}
                    onChange={(e) => setSelectedJuniorId(e.target.value)}
                    className="text-xs px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    {team?.junior_analysts?.map(j => (
                      <option key={j.id} value={j.id}>{j.name} ({j.specialization.split(' ')[0]})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => {
                const isSenior = m.senderRole === 'Senior Analyst';
                return (
                  <div
                    key={m.id}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">{m.senderName}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          isSenior
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                            : 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300'
                        }`}>
                          {m.senderRole}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{m.timestamp}</span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
                      {m.text}
                    </p>

                    {/* Shared Code Snippet Box */}
                    {m.codeSnippet && (
                      <div className="mt-2 rounded-md bg-slate-900 text-slate-100 border border-slate-800 overflow-hidden text-xs">
                        <div className="px-3 py-1.5 bg-slate-950 flex items-center justify-between border-b border-slate-800">
                          <div className="flex items-center space-x-2 text-[11px] text-blue-400 font-mono">
                            <Code className="w-3.5 h-3.5" />
                            <span>{m.codeSnippet.description} ({m.codeSnippet.language})</span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(m.codeSnippet!.code, m.id)}
                            className="flex items-center space-x-1 text-[10px] text-slate-400 hover:text-white"
                          >
                            {copiedId === m.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Code</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-3 font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre">
                          {m.codeSnippet.code}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Code Snippet Input Form (Collapsible) */}
            {isSharingCode && (
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border-t border-blue-200 dark:border-blue-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-900 dark:text-blue-300 flex items-center space-x-1.5">
                    <Code className="w-3.5 h-3.5" />
                    <span>Share Containment / Detection Rule</span>
                  </span>
                  <button
                    onClick={() => setIsSharingCode(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Rule Title (e.g. WAF Rapid-Reset Drop Filter / iptables rule)"
                  value={codeSnippetTitle}
                  onChange={(e) => setCodeSnippetTitle(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
                <textarea
                  rows={3}
                  placeholder="Paste script / signature / firewall rule here..."
                  value={codeSnippetText}
                  onChange={(e) => setCodeSnippetText(e.target.value)}
                  className="w-full text-xs p-2 font-mono rounded border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>
            )}

            {/* Message Input Bar */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsSharingCode(!isSharingCode)}
                title="Share detection/mitigation code"
                className={`p-2 rounded-lg border text-xs font-medium flex items-center space-x-1 transition-colors ${
                  isSharingCode
                    ? 'bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Code className="w-4 h-4" />
                <span className="hidden sm:inline">Code</span>
              </button>

              <input
                type="text"
                placeholder={
                  chatChannel === 'general'
                    ? 'Message #general-soc team...'
                    : `Send direct message to junior analyst...`
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />

              <button
                type="button"
                onClick={handleSendMessage}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Analyst Roster & Provisioning */}
        {activeTab === 'team' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Senior Analyst Card */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Lead Incident Commander (Senior Analyst)
              </h4>
              <div className="p-3 rounded-lg border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    RP
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-xs text-slate-900 dark:text-white">Rohit Patil</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                        Senior Analyst
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      rohit.lead@sentinelgrid.gov.in • Lead Cyber Threat Architect
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  ON CALL
                </span>
              </div>
            </div>

            {/* Junior Analysts List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Junior Analysts ({juniorCount}/3 Provisioned)
                </h4>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                  {3 - juniorCount} slot{3 - juniorCount === 1 ? '' : 's'} remaining
                </span>
              </div>

              <div className="space-y-2">
                {team?.junior_analysts?.map((j, index) => (
                  <div
                    key={j.id}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                        J{index + 1}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-xs text-slate-900 dark:text-white">{j.name}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                            Junior Analyst
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {j.email} • {j.specialization}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedJuniorId(j.id);
                        setChatChannel('dm');
                        setActiveTab('chat');
                      }}
                      className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white rounded transition-colors text-slate-700 dark:text-slate-200"
                    >
                      Direct Message
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Invite Junior Analyst Form (Enforces Max 3) */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center space-x-2 mb-3">
                <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                  Add Junior Analyst (Limit: 3 Max)
                </h5>
              </div>

              {isMaxJuniors ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Maximum capacity reached: A Senior Analyst can supervise up to 3 Junior Analysts.</span>
                </div>
              ) : (
                <form onSubmit={handleInviteJunior} className="space-y-3">
                  {inviteError && (
                    <div className="p-2 bg-red-50 text-red-700 border border-red-200 rounded text-xs">
                      {inviteError}
                    </div>
                  )}
                  {inviteSuccess && (
                    <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs">
                      {inviteSuccess}
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Charlie Patel"
                      value={newAnalystName}
                      onChange={(e) => setNewAnalystName(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. charlie.patel@sentinelgrid.gov.in"
                      value={newAnalystEmail}
                      onChange={(e) => setNewAnalystEmail(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Specialization / Role Duty
                    </label>
                    <select
                      value={newAnalystSpec}
                      onChange={(e) => setNewAnalystSpec(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    >
                      <option value="Vulnerability Triage & IOC Ingestion">Vulnerability Triage & IOC Ingestion</option>
                      <option value="Host Forensics & Memory Inspection">Host Forensics & Memory Inspection</option>
                      <option value="Perimeter WAF & Threat Containment">Perimeter WAF & Threat Containment</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Provision Junior Analyst ({juniorCount + 1}/3)</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

