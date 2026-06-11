import { getAPIURL } from '@/utils/api';
import { useEffect } from 'react';
import { EventSource } from 'eventsource';

export type UseEventSourceOptions = {
  enabled?: boolean;
  path: string;
  token: string;
  targetUserID?: number;
  intervalMillis: number;
  onUpdateEvent?: (event: MessageEvent) => void;
  onRemovedEvent?: (event: MessageEvent) => void;
  onErrorEvent?: (event: MessageEvent) => void;
};

export function useEventSource(options: UseEventSourceOptions) {
  const {
    enabled = true,
    path,
    token,
    targetUserID,
    intervalMillis,
    onUpdateEvent,
    onErrorEvent,
    onRemovedEvent,
  } = options;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const userParam = targetUserID !== undefined ? `&user_id=${targetUserID}` : '';
    const url = `${getAPIURL()}${path}?interval_ms=${intervalMillis}${userParam}`;

    const eventSource = new EventSource(url, {
      fetch: (input, init) => {
        return fetch(input, {
          ...init,
          headers: {
            ...init.headers,
            Authorization: `Bearer ${token}`,
          },
        });
      },
    });

    if (onUpdateEvent) {
      eventSource.addEventListener('update', onUpdateEvent);
    }
    if (onErrorEvent) {
      eventSource.addEventListener('error', onErrorEvent);
    }
    if (onRemovedEvent) {
      eventSource.addEventListener('removed', onRemovedEvent);
    }

    return () => {
      eventSource.close();
    };
  }, [
    token,
    enabled,
    path,
    intervalMillis,
    targetUserID,
    onUpdateEvent,
    onErrorEvent,
    onRemovedEvent,
  ]);
}
