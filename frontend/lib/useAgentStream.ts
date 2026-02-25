'use client';
import { useState, useCallback, useRef } from 'react';
import { API_BASE_URL } from '@/lib/api';

export interface AgentStreamState {
    phase: string;
    phaseLabel: string;
    tokens: string;
    logs: string[];
    status: 'idle' | 'connecting' | 'processing' | 'completed' | 'failed';
    finalResult: any;
    error: string | null;
}

const initialState: AgentStreamState = {
    phase: '',
    phaseLabel: '',
    tokens: '',
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

                    // Route based on event type
                    if (eventType === 'phase') {
                        try {
                            const parsed = JSON.parse(dataStr);
                            setState(prev => ({
                                ...prev,
                                phase: parsed.phase,
                                phaseLabel: parsed.label,
                                status: 'processing',
                            }));
                        } catch { }
                    } else if (eventType === 'token') {
                        try {
                            const parsed = JSON.parse(dataStr);
                            if (parsed.text) {
                                setState(prev => ({
                                    ...prev,
                                    tokens: prev.tokens + parsed.text,
                                    status: 'processing',
                                }));
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
