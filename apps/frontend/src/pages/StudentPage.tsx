import React from 'react';
import StudentView from '../components/student/StudentView';

export const StudentPage: React.FC<any> = (props) => {
  return <StudentView {...props} />;
};

export default StudentPage;
