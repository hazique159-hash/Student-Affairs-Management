'use client';

import { PageHeader } from '@/components/page-header';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function StudentIssuePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const isAdmin = user?.email === 'studentaffairs316@gmail.com' || user?.email?.endsWith('@admin.com');

  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      router.push('/announcements');
    }
  }, [isUserLoading, isAdmin, router]);

  if (isUserLoading || !isAdmin) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Student Issues"
        icon={AlertCircle}
        description="Monitor and manage reported student concerns."
      />
      <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-xl bg-white/50">
        <p className="text-muted-foreground italic">Student Issue reporting area is ready for configuration.</p>
      </div>
    </div>
  );
}
