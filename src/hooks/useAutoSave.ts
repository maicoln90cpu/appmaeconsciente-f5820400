/**
 * Auto-save hook using IndexedDB for form drafts
 * Saves form data automatically with debounce and provides recovery
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import { toast } from 'sonner';

import { indexedDBManager, DraftEntry } from '@/lib/indexed-db';

import { useAuth } from '@/contexts/AuthContext';

export interface UseAutoSaveOptions {
  /** Unique type identifier for this form (e.g., 'enxoval-item', 'post') */
  type: string;
  /** Optional draft ID for editing existing drafts */
  draftId?: string;
  /** Debounce delay in ms (default: 2000) */
  debounceMs?: number;
  /** Enable auto-save (default: true) */
  enabled?: boolean;
  /** Callback when draft is loaded */
  onDraftLoaded?: (data: Record<string, unknown>) => void;
  /** Minimum data to trigger save */
  minDataCheck?: (data: Record<string, unknown>) => boolean;
}

export interface UseAutoSaveReturn<T extends Record<string, unknown>> {
  /** Save draft manually */
  saveDraft: (data: T) => Promise<void>;
  /** Load existing draft */
  loadDraft: () => Promise<T | null>;
  /** Delete current draft */
  deleteDraft: () => Promise<void>;
  /** Current draft ID */
  draftId: string | null;
  /** Whether draft is being saved */
  isSaving: boolean;
  /** Whether draft was recently saved */
  hasSavedRecently: boolean;
  /** Last saved timestamp */
  lastSavedAt: Date | null;
  /** Available drafts for this type */
  availableDrafts: DraftEntry[];
  /** Load a specific draft by ID */
  loadDraftById: (id: string) => Promise<T | null>;
  /** Delete a specific draft by ID */
  deleteDraftById: (id: string) => Promise<void>;
  /** Trigger auto-save with data */
  triggerAutoSave: (data: T) => void;
  /** Clear the saved indicator */
  clearSavedIndicator: () => void;
}

export function useAutoSave<T extends Record<string, unknown>>({
  type,
  draftId: initialDraftId,
  debounceMs = 2000,
  enabled = true,
  onDraftLoaded,
  minDataCheck,
}: UseAutoSaveOptions): UseAutoSaveReturn<T> {
  const { user } = useAuth();
  const [draftId, setDraftId] = useState<string | null>(initialDraftId || null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSavedRecently, setHasSavedRecently] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [availableDrafts, setAvailableDrafts] = useState<DraftEntry[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedIndicatorRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate unique draft key including user
  const getDraftKey = useCallback(
    (id?: string) => {
      const baseId = id || draftId;
      if (baseId) return baseId;
      return `${type}_${user?.id || 'anonymous'}_${Date.now()}`;
    },
    [type, user?.id, draftId]
  );

  // Load available drafts on mount
  useEffect(() => {
    if (!enabled) return;

    const loadAvailableDrafts = async () => {
      try {
        const drafts = await indexedDBManager.getDraftsByType(type);
        // Filter by user if authenticated
        const userDrafts = user?.id
          ? drafts.filter(d => (d.data as Record<string, unknown>).__userId === user.id)
          : drafts;
        setAvailableDrafts(userDrafts);
      } catch (error) {
        console.error('Error loading drafts:', error);
      }
    };

    loadAvailableDrafts();
  }, [type, user?.id, enabled]);

  // Save draft function
  const saveDraft = useCallback(
    async (data: T): Promise<void> => {
      if (!enabled) return;

      // Check minimum data requirement
      if (minDataCheck && !minDataCheck(data)) {
        return;
      }

      setIsSaving(true);
      try {
        const dataWithMeta = {
          ...data,
          __userId: user?.id,
          __savedAt: Date.now(),
        };

        const savedId = await indexedDBManager.saveDraft(type, dataWithMeta, draftId || undefined);

        if (!draftId) {
          setDraftId(savedId);
        }

        setLastSavedAt(new Date());
        setHasSavedRecently(true);

        // Clear saved indicator after 3 seconds
        if (savedIndicatorRef.current) {
          clearTimeout(savedIndicatorRef.current);
        }
        savedIndicatorRef.current = setTimeout(() => {
          setHasSavedRecently(false);
        }, 3000);

        // Refresh available drafts
        const drafts = await indexedDBManager.getDraftsByType(type);
        const userDrafts = user?.id
          ? drafts.filter(d => (d.data as Record<string, unknown>).__userId === user.id)
          : drafts;
        setAvailableDrafts(userDrafts);
      } catch (error) {
        console.error('Error saving draft:', error);
      } finally {
        setIsSaving(false);
      }
    },
    [type, draftId, user?.id, enabled, minDataCheck]
  );

  // Debounced auto-save trigger
  const triggerAutoSave = useCallback(
    (data: T) => {
      if (!enabled) return;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        saveDraft(data);
      }, debounceMs);
    },
    [saveDraft, debounceMs, enabled]
  );

  // Load draft function
  const loadDraft = useCallback(async (): Promise<T | null> => {
    if (!draftId) return null;

    try {
      const draft = await indexedDBManager.getDraft(draftId);
      if (draft) {
        const data = draft.data as T;
        onDraftLoaded?.(data);
        return data;
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
    return null;
  }, [draftId, onDraftLoaded]);

  // Load draft by ID
  const loadDraftById = useCallback(
    async (id: string): Promise<T | null> => {
      try {
        const draft = await indexedDBManager.getDraft(id);
        if (draft) {
          setDraftId(id);
          const data = draft.data as T;
          onDraftLoaded?.(data);
          return data;
        }
      } catch (error) {
        console.error('Error loading draft by ID:', error);
      }
      return null;
    },
    [onDraftLoaded]
  );

  // Delete current draft
  const deleteDraft = useCallback(async (): Promise<void> => {
    if (!draftId) return;

    try {
      await indexedDBManager.deleteDraft(draftId);
      setDraftId(null);
      setLastSavedAt(null);

      // Refresh available drafts
      const drafts = await indexedDBManager.getDraftsByType(type);
      const userDrafts = user?.id
        ? drafts.filter(d => (d.data as Record<string, unknown>).__userId === user.id)
        : drafts;
      setAvailableDrafts(userDrafts);
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  }, [draftId, type, user?.id]);

  // Delete draft by ID
  const deleteDraftById = useCallback(
    async (id: string): Promise<void> => {
      try {
        await indexedDBManager.deleteDraft(id);

        // Clear current draft if it matches
        if (id === draftId) {
          setDraftId(null);
          setLastSavedAt(null);
        }

        // Refresh available drafts
        const drafts = await indexedDBManager.getDraftsByType(type);
        const userDrafts = user?.id
          ? drafts.filter(d => (d.data as Record<string, unknown>).__userId === user.id)
          : drafts;
        setAvailableDrafts(userDrafts);

        toast.success('Rascunho excluído');
      } catch (error) {
        console.error('Error deleting draft:', error);
        toast.error('Erro ao excluir rascunho');
      }
    },
    [draftId, type, user?.id]
  );

  // Clear saved indicator
  const clearSavedIndicator = useCallback(() => {
    setHasSavedRecently(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (savedIndicatorRef.current) {
        clearTimeout(savedIndicatorRef.current);
      }
    };
  }, []);

  return {
    saveDraft,
    loadDraft,
    deleteDraft,
    draftId,
    isSaving,
    hasSavedRecently,
    lastSavedAt,
    availableDrafts,
    loadDraftById,
    deleteDraftById,
    triggerAutoSave,
    clearSavedIndicator,
  };
}
