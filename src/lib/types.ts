
export type Department =
  | 'Computer Science'
  | 'Software Engineering'
  | 'Mathematics'
  | 'Electrical Engineering'
  | 'Mechanical Engineering'
  | 'Civil Engineering'
  | 'Management Sciences'
  | 'Accounting & Finance'
  | 'Psychology'
  | 'English'
  | 'Bioinformatics & Biosciences'
  | 'Pharmacy'
  | 'Law';

export type Student = {
  id: string;
  registrationNumber: string;
  firstName: string;
  lastName: string;
  department: Department;
  name: string;
  email: string;
  phone: string;
  parentEmail: string;
  parentPhone: string;
  recoveryEmail?: string;
  complaintCount?: number;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  datePublished: any;
  imageUrl?: string;
};

export type CounselingSession = {
  id: string;
  studentId: string; // registration number
  studentName: string;
  teacherId: string;
  teacherName: string;
  dateScheduled: any; // Firestore timestamp
  timeSlot: string;
  notes?: string;
};

export type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: Department;
};

export type Fine = {
  id: string;
  studentId: string;
  amount: number;
  dateIssued: string;
  dateDue: string;
  isPaid: boolean;
  reason: string;
};

export type Complaint = {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  description: string;
  status: 'Pending' | 'Open' | 'Approved' | 'Rejected' | 'Resolved';
  dateSubmitted: any;
  filedById: string;
  filedByName: string;
  evidenceUrl?: string;
  paymentReceiptUrl?: string;
  paymentStatus?: 'Unpaid' | 'Submitted' | 'Verified';
};

export type TeacherAvailability = {
  id: string;
  teacherId: string;
  teacherName: string;
  availableDays: string[];
  availableSlots: string[];
};

export type VolunteerApplication = {
  id: string;
  studentId: string;
  studentName: string;
  eventName: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  dateApplied: any;
};
