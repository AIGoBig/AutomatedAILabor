'use client';
import { useState, useCallback, useRef } from 'react';
import { API_BASE_URL } from '@/lib/api';

export interface AgentMessage {
    id: string;
    role: 'supervisor' | 'executor' | 'user';
    phase: string;
    phaseLabel: string;
    content: string;
}

export interface AgentStreamState {
    phase: string;
    phaseLabel: string;
    messages: AgentMessage[];
    logs: string[];
    status: 'idle' | 'connecting' | 'processing' | 'completed' | 'failed' | 'awaiting_input';
    finalResult: any;
    error: string | null;
}

const initialState: AgentStreamState = {
    phase: '',
    phaseLabel: '',
    messages: [],
    logs: [],
    status: 'idle',
    finalResult: null,
    error: null,
};

export function useAgentStream() {
    const [state, setState] = useState<AgentStreamState>(initialState);
    const abortRef = useRef<AbortController | null>(null);

    const startStream = useCallback(async (jobId: string, token?: string | null) => {
        setState({ ...initialState, status: 'connecting' });

        const abortController = new AbortController();
        abortRef.current = abortController;

        try {
            const headers: Record<string, string> = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/stream`, {
                headers,
                signal: abortController.signal,
            });

            if (!response.ok) {
                throw new Error(`Stream failed: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No readable stream');

            const decoder = new TextDecoder();
            const { createParser } = await import('eventsource-parser');
            const parser = createParser({
                onEvent: (event) => {
                    const eventType = event.event;
                    const dataStr = event.data;

                    if (!dataStr) return;

                    if (eventType === 'phase') {
                        try {
                            const parsed = JSON.parse(dataStr);
                            const newRole = parsed.phase === 'execute' ? 'executor' : 'supervisor';

                            setState(prev => ({
                                ...prev,
                                phase: parsed.phase,
                                phaseLabel: parsed.label,
                                status: 'processing',
                                messages: [
                                    ...prev.messages,
                                    {
                                        id: Math.random().toString(36).substring(7),
                                        role: newRole,
                                        phase: parsed.phase,
                                        phaseLabel: parsed.label,
                                        content: ''
                                    }
                                ]
                            }));
                        } catch { }
                    } else if (eventType === 'token') {
                        try {
                            const parsed = JSON.parse(dataStr);
                            if (parsed.text) {
                                setState(prev => {
                                    const newMessages = [...prev.messages];
                                    if (newMessages.length === 0) {
                                        // Fallback if token arrives before phase
                                        newMessages.push({
                                            id: Math.random().toString(36).substring(7),
                                            role: 'executor',
                                            phase: prev.phase,
                                            phaseLabel: prev.phaseLabel,
                                            content: parsed.text
                                        });
                                    } else {
                                        const lastIdx = newMessages.length - 1;
                                        newMessages[lastIdx] = {
                                            ...newMessages[lastIdx],
                                            content: newMessages[lastIdx].content + parsed.text
                                        };
                                    }
                                    return {
                                        ...prev,
                                        messages: newMessages,
                                        status: 'processing',
                                    };
                                });
                            }
                        } catch { }
                    } else if (eventType === 'status') {
                        try {
                            const parsed = JSON.parse(dataStr);
                            setState(prev => ({
                                ...prev,
                                status: parsed.status as any,
                            }));
                        } catch { }
                    } else if (eventType === 'interrupt') {
                        try {
                            const parsed = JSON.parse(dataStr);
                            setState(prev => ({
                                ...prev,
                                status: 'awaiting_input',
                                logs: [...prev.logs, "等待您的干预与确认..."]
                            }));
                        } catch { }
                    } else if (eventType === 'log') {
                        setState(prev => ({
                            ...prev,
                            logs: [...prev.logs, dataStr],
                            status: 'processing',
                        }));
                    } else if (eventType === 'end') {
                        try {
                            const parsed = JSON.parse(dataStr);
                            setState(prev => ({
                                ...prev,
                                finalResult: parsed,
                                status: 'completed',
                            }));
                        } catch { }
                    } else if (eventType === 'error') {
                        setState(prev => ({
                            ...prev,
                            status: 'failed',
                            error: dataStr,
                        }));
                    }
                }
            });

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                parser.feed(decoder.decode(value, { stream: true }));
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setState(prev => ({
                    ...prev,
                    status: 'failed',
                    error: err.message,
                }));
            }
        }
    }, []);

    const stopStream = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
    }, []);

    return { state, startStream, stopStream };
}
