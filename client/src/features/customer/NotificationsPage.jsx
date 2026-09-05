import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 mb-1">Notifications</h1>
        <p className="text-sm text-gray-500">Updates from your libraries — renewals, approvals and announcements.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-8 text-center">
        <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
        <p className="text-sm text-gray-500">No notifications yet.</p>
      </div>
    </div>
  );
}
