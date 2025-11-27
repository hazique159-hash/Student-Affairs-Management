export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  department: 'CS' | 'SE' | 'BBA';
  volunteerHours: number;
  email: string;
  phone: string;
  parentEmail: string;
  parentPhone: string;
};

export type Complaint = {
  id: string;
  studentId: string;
  studentName: string;
  dateSubmitted: string;
  violationType: string;
  teacherId: string;
  status: 'Pending' | 'Approved' | 'Resolved';
  details: string;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  date: string;
};

export type CounselingSession = {
    id: string;
    studentId: string;
    studentName: string;
    date: Date;
    time: string;
};

export type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
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
