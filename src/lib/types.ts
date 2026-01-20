export type Student = {
  id: string;
  registrationNumber: string;
  firstName: string;
  lastName: string;
  department: 'CS' | 'SE' | 'BBA';
  email: string;
  phone: string;
  parentEmail: string;
  parentPhone: string;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  datePublished: string;
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

    