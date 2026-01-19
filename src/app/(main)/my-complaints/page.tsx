'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DeprecatedMyComplaintsPage() {
  const router = useRouter();

  useEffect(() => {
    // This page is deprecated. Redirect to the unified complaints page.
    router.replace('/complaints');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecting to the new complaints page...</p>
      </div>
    </div>
  );
}
