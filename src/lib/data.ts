import type { Student, CounselingSession, Fine, Complaint } from './types';

export const students: Student[] = [
  { id: 'BCS223089', firstName: 'Muhammad', lastName: 'Hazique', department: 'CS', name: 'Muhammad Hazique', email: 'hazique@example.com', phone: '123-456-7890', parentEmail: 'parent.hazique@example.com', parentPhone: '098-765-4321' },
  { id: 'BCS223094', firstName: 'Amna', lastName: 'Zara', department: 'SE', name: 'Amna Zara', email: 'amna@example.com', phone: '123-456-7890', parentEmail: 'parent.amna@example.com', parentPhone: '098-765-4321' },
  { id: 'BCS233064', firstName: 'Abeera', lastName: 'Faheem', department: 'BBA', name: 'Abeera Faheem', email: 'abeera@example.com', phone: '123-456-7890', parentEmail: 'parent.abeera@example.com', parentPhone: '098-765-4321' },
  { id: 'CS-004', firstName: 'Muhammad', lastName: 'Haziq', department: 'CS', name: 'Muhammad Haziq', email: 'john@example.com', phone: '123-456-7890', parentEmail: 'parent.john@example.com', parentPhone: '098-765-4321' },
  { id: 'SE-005', firstName: 'Jane', lastName: 'Smith', department: 'SE', name: 'Jane Smith', email: 'jane@example.com', phone: '123-456-7890', parentEmail: 'parent.jane@example.com', parentPhone: '098-765-4321' },
  { id: 'BBA-006', firstName: 'Peter', lastName: 'Jones', department: 'BBA', name: 'Peter Jones', email: 'peter@example.com', phone: '123-456-7890', parentEmail: 'parent.peter@example.com', parentPhone: '098-765-4321' },
  { id: 'BCS223000', firstName: 'Dummy', lastName: 'Student', department: 'SE', name: 'Dummy Student', email: 'dummy@example.com', phone: '111-222-3333', parentEmail: 'parent.dummy@example.com', parentPhone: '444-555-6666' },
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

export const fines: Fine[] = [
  { id: 'F001', studentId: 'BCS223089', amount: 500, dateIssued: new Date(2024, 5, 15).toISOString(), dateDue: new Date(2024, 6, 15).toISOString(), isPaid: false, reason: 'Late submission of assignment' },
  { id: 'F002', studentId: 'BCS223089', amount: 200, dateIssued: new Date(2024, 4, 20).toISOString(), dateDue: new Date(2024, 5, 20).toISOString(), isPaid: true, reason: 'Library book overdue' },
  { id: 'F003', studentId: 'BCS223000', amount: 1000, dateIssued: new Date(2024, 6, 1).toISOString(), dateDue: new Date(2024, 7, 1).toISOString(), isPaid: false, reason: 'Vandalism in common room' },
  { id: 'F004', studentId: 'BCS223089', amount: 1000, dateIssued: new Date(2024, 6, 25).toISOString(), dateDue: new Date(2024, 7, 25).toISOString(), isPaid: false, reason: 'Misconduct in examination hall' },
];

export const complaints: Complaint[] = [
    { id: 'C001', studentId: 'BCS223089', studentName: 'Muhammad Hazique', title: 'Wifi not working in library', description: 'The wifi connection in the main library has been unstable for the past three days.', status: 'Pending', dateSubmitted: new Date(2024, 6, 18).toISOString(), filedById: 'system', filedByName: 'Admin' },
    { id: 'C002', studentId: 'BCS223094', studentName: 'Amna Zara', title: 'Cafeteria food quality', description: 'The quality of food in the main cafeteria has noticeably declined this semester.', status: 'Open', dateSubmitted: new Date(2024, 6, 19).toISOString(), filedById: 'system', filedByName: 'Admin' },
    { id: 'C003', studentId: 'BCS223089', studentName: 'Muhammad Hazique', title: 'Broken chair in Lab 4', description: 'One of the chairs in computer lab 4 has a broken leg and is a safety hazard.', status: 'Resolved', dateSubmitted: new Date(2024, 6, 15).toISOString(), filedById: 'system', filedByName: 'Admin' },
];
