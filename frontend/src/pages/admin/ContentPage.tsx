/**
 * Admin Content Moderation Page
 * Review and moderate pending content submissions
 */
import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { usePendingContent, useApproveContent, useRejectContent } from '@/hooks/admin';
import { ContentRejectModal } from '@/components/admin/ContentRejectModal';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { formatDateTime } from '@/lib/utils';
import type { AdminContentItem } from '@/types/admin';

interface ContentPageProps {
  onNavigate: (path: string) => void;
}

export function ContentPage({ onNavigate }: ContentPageProps) {
  const { content, isLoading, refetch } = usePendingContent();
  const { approve } = useApproveContent(() => refetch());
  const { reject } = useRejectContent(() => refetch());

  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    contentId?: number;
    contentTitle?: string;
  }>({ isOpen: false });

  const handleApprove = async (contentId: number) => {
    await approve(contentId);
  };

  const handleRejectSubmit = async (reason: string) => {
    if (rejectModal.contentId) {
      await reject(rejectModal.contentId, reason);
      setRejectModal({ isOpen: false });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold font-heading text-ink">Content Moderation</h1>
        <p className="text-sm text-muted mt-1">
          Review and approve submissions from content writers
        </p>
      </div>

      {/* Content Queue */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-terracotta animate-spin" />
        </div>
      ) : content.length > 0 ? (
        <div className="space-y-4">
          {content.map((item) => (
            <div key={item.id} className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {item.category_name && (
                      <span className="inline-block px-2 py-1 rounded bg-terracotta/10 text-xs font-semibold text-terracotta">
                        {item.category_name}
                      </span>
                    )}
                    {item.language && (
                      <span className="inline-block px-2 py-1 rounded bg-gray-100 text-xs font-semibold text-gray-600">
                        {item.language.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold font-heading text-ink">{item.title}</h3>
                  <p className="text-sm text-muted mt-1">
                    By {item.writer_name || 'Unknown'} • {formatDateTime(item.created_at)}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>

              {/* Preview */}
              <p className="text-sm text-ink line-clamp-3 mb-4">{item.description || item.content}</p>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(item.id)}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-sage text-white font-semibold hover:bg-green-700 transition-colors"
                >
                  ✓ Approve & Publish
                </button>
                <button
                  onClick={() =>
                    setRejectModal({
                      isOpen: true,
                      contentId: item.id,
                      contentTitle: item.title,
                    })
                  }
                  className="flex-1 px-4 py-2.5 rounded-lg border-2 border-rose-600 text-rose-600 font-semibold hover:bg-rose-50 transition-colors"
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-ink mb-2">✓ All Clear!</p>
          <p className="text-sm text-muted">No pending content awaiting moderation</p>
        </div>
      )}

      {/* Reject Modal */}
      <ContentRejectModal
        isOpen={rejectModal.isOpen}
        contentTitle={rejectModal.contentTitle}
        onConfirm={handleRejectSubmit}
        onCancel={() => setRejectModal({ isOpen: false })}
      />
    </div>
  );
}
