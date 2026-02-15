# AffairsConnect - Student Affairs Management System

This is a modern Student Affairs Management portal built with Next.js and Firebase.

## Technology Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** ShadCN UI (Radix UI)
- **Icons:** Lucide React
- **Charts:** Recharts (via ShadCN)

### Backend & Database
- **Identity & Auth:** Firebase Authentication (with Admin Aliasing)
- **Database:** Cloud Firestore (NoSQL Real-time Database)
- **AI Framework:** Genkit (for Generative AI features)
- **Server Logic:** Next.js Server Actions

### Deployment
- **Hosting:** Firebase App Hosting

## Database Structure (Who is Who?)

The system uses specific Firestore collections to manage roles and data mapping:

- **`roles_admin/{uid}`**: Stores administrator profiles. Existence of a UID here (or matching the primary admin email) grants full system access.
- **`teachers/{uid}`**: Stores teacher profiles. Existence of a UID here grants teacher privileges (e.g., filing complaints, viewing student lists).
- **`students/{registrationNumber}`**: The master directory of all enrolled students. Stores personal info and global metrics like `complaintCount`.
- **`users/{uid}`**: A mapping collection. For students, it links their Firebase Auth UID to their `registrationNumber`. This allows the system to securely fetch student-specific subcollections like `/fines` or `/counselingSessions`.

## Key Features

- **Admin Panel:** Manage student and teacher records, announcements, and system configuration.
- **Analytics:** Visual insights into department performance and complaints.
- **Complaint Management:** Full lifecycle for filing, reviewing, and resolving student complaints.
- **Counseling Services:** Teacher availability scheduling and session management.
- **Volunteer Portal:** Students can apply for events, and admins can manage applications.
- **Security:** Role-based access control (RBAC) enforced via Firestore Security Rules.

## Getting Started

To get started, log in with the administrator credentials or a student registration number.
