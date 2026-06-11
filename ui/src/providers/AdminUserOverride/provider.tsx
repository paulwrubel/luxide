import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminUserOverrideContext } from './context';

export type AdminUserOverrideProviderProps = {
  children: React.ReactNode;
};

export function AdminUserOverrideProvider(props: AdminUserOverrideProviderProps) {
  const { children } = props;

  const [searchParams, setSearchParams] = useSearchParams();

  const targetUserID = useMemo(() => {
    const raw = searchParams.get('user_id');
    if (raw === null) {
      return undefined;
    }
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) {
      return undefined;
    }
    return parsed;
  }, [searchParams]);

  const setTargetUserID = useCallback(
    (userId: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('user_id', String(userId));
        return next;
      });
    },
    [setSearchParams],
  );

  const clearTargetUserID = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('user_id');
      return next;
    });
  }, [setSearchParams]);

  const value = useMemo(
    () => ({ targetUserID, setTargetUserID, clearTargetUserID }),
    [targetUserID, setTargetUserID, clearTargetUserID],
  );

  return (
    <AdminUserOverrideContext.Provider value={value}>{children}</AdminUserOverrideContext.Provider>
  );
}
