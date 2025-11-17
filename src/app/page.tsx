'use client';
import { useFirebase } from '@/firebase';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { user, isUserLoading } = useFirebase();

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        redirect('/announcements');
      } else {
        redirect('/login');
      }
    }
  }, [user, isUserLoading]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
