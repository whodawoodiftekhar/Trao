'use client';

import { useKitsQuery, useDeleteKitMutation } from '@/lib/queries';

export function useDashboard() {
  const { data: kits = [], isLoading, error, refetch } = useKitsQuery();
  const deleteMutation = useDeleteKitMutation();

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this prep kit?')) return;

    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      console.warn('[Dashboard] Delete kit server error:', err);
    }
  };

  return {
    kits,
    isLoading,
    error: error ? (error as Error).message || 'Failed to load kits' : null,
    refreshKits: refetch,
    handleDelete
  };
}
