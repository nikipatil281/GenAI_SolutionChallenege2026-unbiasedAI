import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Markdown from 'react-markdown';
import { Bot, Database, Loader2, MessageSquareMore, Scale, Send, ShieldCheck, Sparkles, Trash2, User, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAudit } from '../../context/AuditContext';
import { cn } from '../../lib/utils';
import { apiUrl } from '../../lib/api';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

const STARTER_PROMPTS = [
  'What stands out in this dataset before I run the full audit?',
  'Which columns look like possible protected attributes or proxy risks?',
  'What are the biggest fairness issues I should investigate first?',
  'What should I fix before I trust this system?',
];

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function DataChat() {
  const {
    dataset,
    datasetStats,
    problemFraming,
    associations,
    fairnessMetrics,
    subgroups,
    governance,
    targetColumn,
    groundTruthColumn,
    protectedColumns,
    llmMessages,
    systemDecision,
    chatMessages,
    addChatMessage,
    clearChatMessages,
  } = useAudit();

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const hasDataset = Boolean(dataset?.length);
  const sociotechnicalWaterfallComplete = ['project-setup', 'proxy', 'subgroup'].every((type) =>
    llmMessages.some((message) => message.type === type)
  );
  const governanceReviewed = llmMessages.some((message) => message.type === 'governance');
  const chatReady = hasDataset && sociotechnicalWaterfallComplete;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, sending]);

  const sendMessage = async (prefilled?: string) => {
    const message = (prefilled ?? draft).trim();
    if (!message || sending) return;

    if (!chatReady) {
      toast.error('Run the sociotechnical waterfall first to unlock the dataset chat. Governance is optional.');
      return;
    }

    const userMessage = {
      id: createMessageId(),
      role: 'user' as const,
      content: message,
    };

    addChatMessage(userMessage);
    setDraft('');
    setSending(true);

    try {
      const history = [...chatMessages, userMessage].map(({ role, content }) => ({ role, content }));
      const res = await axios.post(apiUrl('/api/agent/chat'), {
        message,
        history,
        context: {
          dataset,
          datasetStats,
          problemFraming,
          associations,
          fairnessMetrics,
          subgroups,
          governance,
          targetColumn,
          groundTruthColumn,
          protectedColumns,
          llmMessages,
          systemDecision,
        }
      });

      addChatMessage({
        id: createMessageId(),
        role: 'assistant',
        content: res.data.response || 'I could not generate a grounded response for that question.',
      });
    } catch (e: any) {
      toast.error('The audit bot could not answer right now.', {
        description: e.response?.data?.error || e.message,
      });
      addChatMessage({
        id: createMessageId(),
        role: 'assistant',
        content: 'I hit an error while reading the audit context. Please try your question again.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="h-full bg-[radial-gradient(circle_at_top,rgba(242,125,38,0.12),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.88),rgba(228,227,224,0.96))] p-6">
      <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-[#141414] bg-white shadow-[8px_8px_0px_#141414]">
        <div className="border-b border-[#141414] px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-[#F27D26]/30 bg-[#F27D26]/10 p-3 text-[#F27D26]">
                  <MessageSquareMore className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight">Talk To An AI Bot About Your Data</h2>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#141414]/50">
                    Dataset-aware audit copilot
                  </p>
                </div>
              </div>

              <p className="max-w-3xl text-sm leading-6 text-[#141414]/70">
                This assistant can use whatever audit context is currently available: your uploaded dataset, deterministic
                statistics, proxy signals, fairness metrics, subgroup findings, governance answers, and previous LLM memos.
                Governance adds extra context, but it is not required to start the chat.
              </p>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1 border border-[#141414]/10 bg-[#141414]/5 text-[#141414]">
                  <Database className="h-3 w-3" />
                  {dataset?.length || 0} rows loaded
                </Badge>
                <Badge variant="secondary" className="gap-1 border border-[#141414]/10 bg-[#141414]/5 text-[#141414]">
                  <Scale className="h-3 w-3" />
                  {fairnessMetrics ? Object.keys(fairnessMetrics).length : 0} fairness views
                </Badge>
                <Badge variant="secondary" className="gap-1 border border-[#141414]/10 bg-[#141414]/5 text-[#141414]">
                  <Users className="h-3 w-3" />
                  {subgroups ? Object.keys(subgroups).length : 0} subgroup slices
                </Badge>
                <Badge variant="secondary" className="gap-1 border border-[#141414]/10 bg-[#141414]/5 text-[#141414]">
                  <ShieldCheck className="h-3 w-3" />
                  {governanceReviewed ? 'Governance memo ready' : 'Governance optional'}
                </Badge>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={clearChatMessages}
              disabled={chatMessages.length === 0 || sending}
              className="shrink-0 border-[#141414]/20"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Chat
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {!chatReady ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Bot className="mb-4 h-14 w-14 text-[#141414]/15" />
              <h3 className="text-lg font-bold uppercase tracking-tight">Chat Unlocks After Sociotechnical Waterfall</h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-[#141414]/55">
                Complete the core sociotechnical audit first. Governance is optional and only adds extra context to the conversation.
              </p>
            </div>
          ) : chatMessages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="rounded-full border border-[#F27D26]/20 bg-[#F27D26]/10 p-5 text-[#F27D26]">
                <Sparkles className="h-10 w-10" />
              </div>
              <h3 className="mt-6 text-2xl font-bold uppercase tracking-tight">Ask Anything About This Audit</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#141414]/60">
                The core sociotechnical analysis is ready, so you can now ask grounded questions about the dataset, risks, and findings.
              </p>

              <div className="mt-8 grid w-full max-w-3xl gap-3 md:grid-cols-2">
                {STARTER_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="rounded-2xl border border-[#141414]/15 bg-[#141414]/[0.03] p-4 text-left transition-colors hover:border-[#F27D26] hover:bg-[#F27D26]/8"
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#F27D26]" />
                      <span className="text-sm font-medium leading-6 text-[#141414]">{prompt}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-4xl flex-col gap-4">
              {chatMessages.map(message => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-3xl border px-5 py-4 shadow-sm",
                      message.role === 'user'
                        ? "border-[#141414] bg-[#141414] text-[#E4E3E0]"
                        : "border-[#141414]/15 bg-[#FCFBF9] text-[#141414]"
                    )}
                  >
                    <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] opacity-60">
                      {message.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                      <span>{message.role === 'user' ? 'You' : 'Audit Bot'}</span>
                    </div>
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none text-[#141414] prose-headings:uppercase prose-headings:tracking-wider prose-a:text-[#F27D26]">
                        <Markdown>{message.content}</Markdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-3xl border border-[#141414]/15 bg-[#FCFBF9] px-5 py-4 text-[#141414] shadow-sm">
                    <div className="flex items-center gap-3 text-sm text-[#141414]/60">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking through your dataset and audit trail...
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="border-t border-[#141414]/10 bg-[#FCFBF9] px-6 py-5">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-[24px] border border-[#141414] bg-white p-3 shadow-[4px_4px_0px_#141414]">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder="Ask about the dataset, a protected group, a proxy feature, the governance memo, or the final recommendation..."
                className="min-h-[88px] resize-none border-0 px-2 py-2 shadow-none focus-visible:ring-0"
                disabled={!chatReady || sending}
              />

              <div className="mt-3 flex items-center justify-between gap-3 px-2 pb-1">
                <p className="text-xs text-[#141414]/45">
                  Press Enter to send, Shift+Enter for a new line.
                </p>
                <Button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={!draft.trim() || sending || !chatReady}
                  className="min-w-[132px]"
                >
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
