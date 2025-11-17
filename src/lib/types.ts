export type Student = {
  id: string;
  name: string;
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
  date: string;
  violation: string;
  submittedBy: string;
  status: 'Pending' | 'Approved' | 'Resolved';
  comments: string;
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
