import React, { useState, useRef } from 'react';
import { CheckCircle, Circle, Upload, Send, PackageCheck, ScanLine, Video, Loader2 } from 'lucide-react';
import { formatPKTDateTime } from '../utils/date';

interface LifecycleData {
  lifecycle_status: string;
  scanned_at?: string;
  scanned_by?: string;
  video_uploaded_at?: string;
  video_url?: string;
  sent_at?: string;
  sent_by?: string;
  confirmed_at?: string;
  confirmed_by?: string;
}

interface TicketLifecycleProps {
  ticketId: string;
  lifecycle: LifecycleData | null;
  onLifecycleUpdate: () => void;
}

const STAGES = [
  { key: 'generated', label: 'Generated', icon: Circle },
  { key: 'scanned', label: 'Scanned', icon: ScanLine },
  { key: 'video_uploaded', label: 'Video Uploaded', icon: Video },
  { key: 'sent', label: 'Sent', icon: Send },
  { key: 'confirmed', label: 'Confirmed', icon: PackageCheck },
];

function getStageIndex(status: string): number {
  const idx = STAGES.findIndex(s => s.key === status);
  return idx >= 0 ? idx : 0;
}

export default function TicketLifecycle({ ticketId, lifecycle, onLifecycleUpdate }: TicketLifecycleProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem('kartal_token');
  const currentStatus = lifecycle?.lifecycle_status || 'generated';
  const currentIndex = getStageIndex(currentStatus);

  const callLifecycleApi = async (url: string, method: string, body?: FormData | null) => {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
    };
    const opts: RequestInit = { method, headers };
    if (body) {
      opts.body = body;
    }
    const res = await fetch(url, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Action failed');
    return data;
  };

  const handleMarkScanned = async () => {
    setActionLoading('scan');
    setActionError(null);
    try {
      await callLifecycleApi(`/api/tickets/${encodeURIComponent(ticketId)}/lifecycle/scan`, 'PUT');
      onLifecycleUpdate();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setActionLoading('video');
    setActionError(null);
    try {
      const formData = new FormData();
      formData.append('video', file);
      await callLifecycleApi(`/api/tickets/${encodeURIComponent(ticketId)}/lifecycle/video`, 'POST', formData);
      onLifecycleUpdate();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(null);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleMarkSent = async () => {
    setActionLoading('send');
    setActionError(null);
    try {
      await callLifecycleApi(`/api/tickets/${encodeURIComponent(ticketId)}/lifecycle/send`, 'PUT');
      onLifecycleUpdate();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Ticket Lifecycle</h3>
      </div>

      {/* Stepper */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            const IconComponent = stage.icon;
            return (
              <React.Fragment key={stage.key}>
                <div className="flex flex-col items-center relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted
                      ? isCurrent
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-green-500 border-green-500 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted && !isCurrent ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <IconComponent className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`mt-2 text-xs font-medium text-center whitespace-nowrap ${
                    isCompleted ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {stage.label}
                  </span>
                </div>
                {idx < STAGES.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mt-[-1rem] ${
                    idx < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Lifecycle timestamps */}
        {lifecycle && (
          <div className="text-xs text-gray-500 space-y-1 mb-4">
            {lifecycle.scanned_at && <p>Scanned: {formatPKTDateTime(lifecycle.scanned_at)}{lifecycle.scanned_by ? ` by ${lifecycle.scanned_by}` : ''}</p>}
            {lifecycle.video_uploaded_at && <p>Video uploaded: {formatPKTDateTime(lifecycle.video_uploaded_at)}</p>}
            {lifecycle.sent_at && <p>Sent: {formatPKTDateTime(lifecycle.sent_at)}{lifecycle.sent_by ? ` by ${lifecycle.sent_by}` : ''}</p>}
            {lifecycle.confirmed_at && <p>Confirmed: {formatPKTDateTime(lifecycle.confirmed_at)}{lifecycle.confirmed_by ? ` by ${lifecycle.confirmed_by}` : ''}</p>}
          </div>
        )}

        {/* Error display */}
        {actionError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {actionError}
          </div>
        )}

        {/* Action buttons based on current status */}
        <div className="flex flex-col sm:flex-row gap-3">
          {currentStatus === 'generated' && (
            <button
              onClick={handleMarkScanned}
              disabled={actionLoading === 'scan'}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {actionLoading === 'scan' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
              Mark as Scanned
            </button>
          )}

          {currentStatus === 'scanned' && (
            <>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
                id="video-upload"
              />
              <button
                onClick={() => videoInputRef.current?.click()}
                disabled={actionLoading === 'video'}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading === 'video' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload Video
              </button>
            </>
          )}

          {currentStatus === 'video_uploaded' && (
            <button
              onClick={handleMarkSent}
              disabled={actionLoading === 'send'}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {actionLoading === 'send' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Mark as Sent
            </button>
          )}

          {currentStatus === 'sent' && (
            <p className="text-sm text-amber-600 font-medium py-2">Waiting for customer confirmation...</p>
          )}

          {currentStatus === 'confirmed' && (
            <p className="text-sm text-green-600 font-medium py-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Lifecycle complete - customer confirmed receipt
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
