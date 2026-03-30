
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MyFinesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to my-complaints as fines are now integrated there
    router.replace('/my-complaints');
  }, [router]);

  return null;
}
