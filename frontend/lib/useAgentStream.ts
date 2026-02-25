'use client';
import { useState, useCallback, useRef } from 'react';
import { API_BASE_URL } from '@/lib/api';

export interface StreamEvent {
    type: 'phase' | 'token' | 'log' | 'status' | 'end' | 'error';
    data: any;
}

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
        // Reset state
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
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('event:')) {
                        const eventType = line.slice(6).trim();
                        continue;
                    }

                    if (line.startsWith('data:')) {
                        const rawData = line.slice(5).trim();

                        // We need to figure out the event type from the previous 'event:' line
                        // SSE format: event: <type>\ndata: <data>\n\n
                        // The sse-starlette library sends them as JSON with event field
                        try {
                            // Try to parse as our structured event
                            const parsed = JSON.parse(rawData);

                            // Detect event type from content
                            if (parsed.phase !== undefined && parsed.label !== undefined) {
                                // Phase event
                                setState(prev => ({
                                    ...prev,
                                    phase: parsed.phase,
                                    phaseLabel: parsed.label,
                                    status: 'processing',
                                }));
                            } else if (parsed.text !== undefined) {
                                // Token event
                                setState(prev => ({
                                    ...prev,
                                    tokens: prev.tokens + parsed.text,
                                    status: 'processing',
                                }));
                            } else if (parsed.status !== undefined) {
                                // Status event
                                setState(prev => ({
                                    ...prev,
                                    status: parsed.status as any,
                                }));
                            } else {
                                // Could be end event (final state) or other
                                // Check if it has report field → final state
                                if (parsed.report !== undefined) {
                                    setState(prev => ({
                                        ...prev,
                                        finalResult: parsed,
                                        status: 'completed',
                                    }));
                                }
                            }
                        } catch {
                            // Plain text log/error
                            setState(prev => ({
                                ...prev,
                                logs: [...prev.logs, rawData],
                            }));
                        }
                    }
                }
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
