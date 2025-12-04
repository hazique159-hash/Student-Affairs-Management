import type { Student, Complaint, Announcement, CounselingSession, Teacher } from './types';

export const students: Student[] = [
  { id: 'BCS223089', firstName: 'Muhammad', lastName: 'Hazique', department: 'CS', volunteerHours: 20, email: 'hazique@example.com', phone: '123-456-7890', parentEmail: 'parent.hazique@example.com', parentPhone: '098-765-4321' },
  { id: 'BCS223094', firstName: 'Amna', lastName: 'Zara', department: 'SE', volunteerHours: 15, email: 'amna@example.com', phone: '123-456-7890', parentEmail: 'parent.amna@example.com', parentPhone: '098-765-4321' },
  { id: 'BCS233064', firstName: 'Abeera', lastName: 'Faheem', department: 'BBA', volunteerHours: 30, email: 'abeera@example.com', phone: '123-456-7890', parentEmail: 'parent.abeera@example.com', parentPhone: '098-765-4321' },
  { id: 'CS-004', firstName: 'Muhammad', lastName: 'Haziq', department: 'CS', volunteerHours: 5, email: 'john@example.com', phone: '123-456-7890', parentEmail: 'parent.john@example.com', parentPhone: '098-765-4321' },
  { id: 'SE-005', firstName: 'Jane', lastName: 'Smith', department: 'SE', volunteerHours: 40, email: 'jane@example.com', phone: '123-456-7890', parentEmail: 'parent.jane@example.com', parentPhone: '098-765-4321' },
  { id: 'BBA-006', firstName: 'Peter', lastName: 'Jones', department: 'BBA', volunteerHours: 12, email: 'peter@example.com', phone: '123-456-7890', parentEmail: 'parent.peter@example.com', parentPhone: '098-765-4321' },
];

export const predefinedViolations = [
    'Academic Misconduct',
    'Disruptive Behavior',
    'Vandalism',
    'Late Submission',
    'Other'
];

export const complaints: Complaint[] = [
    // This data is now fetched from Firestore
];

export const announcements: Announcement[] = [
     // This data is now fetched from Firestore
];

export const counselingSessions: CounselingSession[] = [
    { id: 'S001', studentId: 'CS-004', studentName: 'Muhammad Haziq', date: new Date(2024, 6, 20), time: '10:00 AM' },
    { id: 'S002', studentId: 'BCS223094', studentName: 'Amna Zara', date: new Date(2024, 6, 22), time: '02:00 PM' },
];

export const finedStudentsData = [
  { department: 'CS', students: 5, fill: 'hsl(var(--chart-1))' },
  { department: 'SE', students: 8, fill: 'hsl(var(--chart-2))' },
  { department: 'BBA', students: 3, fill: 'hsl(var(--chart-3))' },
];
