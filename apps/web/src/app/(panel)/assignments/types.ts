export interface LinkItem {
  name: string;
  url: string;
}
export interface Submission {
  id: string;
  studentId: string;
  studentName?: string | null;
  text: string | null;
  files: LinkItem[];
  submittedAt: string;
  late: boolean;
  score: number | null;
  maxScore: number;
  feedback: string | null;
  gradedAt: string | null;
}
export interface Assignment {
  id: string;
  groupId: string;
  groupName: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description: string | null;
  attachments: LinkItem[];
  dueAt: string | null;
  maxScore: number;
  archivedAt: string | null;
  createdAt: string;
  counts?: { students: number; submitted: number; graded: number };
  mySubmission?: { submittedAt: string; late: boolean; score: number | null; graded: boolean } | null;
  submissions?: Submission[];
  submission?: Submission | null;
}
