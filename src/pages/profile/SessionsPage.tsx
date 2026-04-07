import { SessionManagement } from '@/components/profile/SessionManagement';
import { LoginActivity } from '@/components/profile/LoginActivity';

export default function SessionsPage() {
  return (
    <div className="space-y-6">
      <SessionManagement />
      <LoginActivity />
    </div>
  );
}
