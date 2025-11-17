
import { NextResponse, type NextRequest } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, setDoc, doc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Ensure Firebase is initialized
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const auth = getAuth();
const firestore = getFirestore();

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Check if admin already exists - this is a simplification
    // A real app should handle this more robustly
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
    
        // Add user to roles_admin collection
        await setDoc(doc(firestore, 'roles_admin', user.uid), {
            id: user.uid,
            username: email.split('@')[0],
            email: email
        });

        return NextResponse.json({ message: 'Admin user created successfully', userId: user.uid }, { status: 201 });

    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            return NextResponse.json({ message: 'Admin user already exists' }, { status: 200 });
        }
        throw error;
    }

  } catch (error: any) {
    console.error('Error creating admin user:', error);
    return NextResponse.json({ error: error.message || 'Failed to create admin user' }, { status: 500 });
  }
}
