import type { Student, Complaint, Announcement, CounselingSession } from './types';

export const students: Student[] = [
  { id: 'BCS223089', name: 'Muhammad Hazique', department: 'CS', volunteerHours: 20, email: 'hazique@example.com', phone: '123-456-7890', parentEmail: 'parent.hazique@example.com', parentPhone: '098-765-4321' },
  { id: 'BCS223094', name: 'Amna Zara', department: 'SE', volunteerHours: 15, email: 'amna@example.com', phone: '123-456-7890', parentEmail: 'parent.amna@example.com', parentPhone: '098-765-4321' },
  { id: 'BCS233064', name: 'Abeera Faheem', department: 'BBA', volunteerHours: 30, email: 'abeera@example.com', phone: '123-456-7890', parentEmail: 'parent.abeera@example.com', parentPhone: '098-765-4321' },
  { id: 'CS-004', name: 'John Doe', department: 'CS', volunteerHours: 5, email: 'john@example.com', phone: '123-456-7890', parentEmail: 'parent.john@example.com', parentPhone: '098-765-4321' },
  { id: 'SE-005', name: 'Jane Smith', department: 'SE', volunteerHours: 40, email: 'jane@example.com', phone: '123-456-7890', parentEmail: 'parent.jane@example.com', parentPhone: '098-765-4321' },
  { id: 'BBA-006', name: 'Peter Jones', department: 'BBA', volunteerHours: 12, email: 'peter@example.com', phone: '123-456-7890', parentEmail: 'parent.peter@example.com', parentPhone: '098-765-4321' },
];

export const predefinedViolations = [
    'Academic Misconduct',
    'Disruptive Behavior',
    'Vandalism',
    'Late Submission',
    'Other'
];

export const complaints: Complaint[] = [
    { id: 'C001', studentId: 'BCS223089', studentName: 'Muhammad Hazique', date: '2024-05-01', violation: 'Late Submission', submittedBy: 'Dr. Alan Grant', status: 'Pending', comments: 'Submitted assignment 3 days late.'},
    { id: 'C002', studentId: 'BCS223094', studentName: 'Amna Zara', date: '2024-05-02', violation: 'Disruptive Behavior', submittedBy: 'Dr. Ellie Sattler', status: 'Approved', comments: 'Was talking loudly during the lecture.'},
    { id: 'C003', studentId: 'CS-004', studentName: 'John Doe', date: '2024-04-28', violation: 'Academic Misconduct', submittedBy: 'Dr. Ian Malcolm', status: 'Resolved', comments: 'Caught cheating on the midterm exam.'},
    { id: 'C004', studentId: 'SE-005', studentName: 'Jane Smith', date: '2024-05-10', violation: 'Vandalism', submittedBy: 'Mr. Ray Arnold', status: 'Pending', comments: 'Wrote on a desk in the computer lab.'},
    { id: 'C005', studentId: 'BCS223089', studentName: 'Muhammad Hazique', date: '2024-05-11', violation: 'Disruptive Behavior', submittedBy: 'Dr. Henry Wu', status: 'Approved', comments: 'Repeatedly interrupted other students.'},
    { id: 'C006', studentId: 'BCS223089', studentName: 'Muhammad Hazique', date: '2024-05-12', violation: 'Late Submission', submittedBy: 'Dr. Alan Grant', status: 'Approved', comments: 'Another late assignment. This is the third notification.'},
];

export const announcements: Announcement[] = [
    { id: 'A001', title: 'Mid-Term Exam Schedule', content: 'The mid-term exam schedule for all departments has been posted on the main notice board and is available on the university website.', date: '2024-05-10'},
    { id: 'A002', title: 'Volunteer Service Opportunity', content: 'A beach cleanup event is scheduled for this Saturday. All students are encouraged to participate to fulfill their volunteer service hours.', date: '2024-05-08'},
    { id: 'A003', title: 'System Maintenance', content: 'The student portal will be down for scheduled maintenance on Sunday from 2 AM to 4 AM.', date: '2024-05-05'},
];

export const counselingSessions: CounselingSession[] = [
    { id: 'S001', studentId: 'CS-004', studentName: 'John Doe', date: new Date(2024, 6, 20), time: '10:00 AM' },
    { id: 'S002', studentId: 'BCS223094', studentName: 'Amna Zara', date: new Date(2024, 6, 22), time: '02:00 PM' },
];

export const finedStudentsData = [
  { department: 'CS', students: 5, fill: 'hsl(var(--chart-1))' },
  { department: 'SE', students: 8, fill: 'hsl(var(--chart-2))' },
  { department: 'BBA', students: 3, fill: 'hsl(var(--chart-3))' },
];
