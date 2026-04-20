import React from 'react';
import ResponsiveState from './ResponsiveState';

type InternetRequiredStateProps = {
  title?: string;
  description?: string;
};

const InternetRequiredState: React.FC<InternetRequiredStateProps> = ({
  title = 'الاتصال بالإنترنت مطلوب',
  description = 'هذه الصفحة تحتاج اتصالاً بالإنترنت لتحميل أحدث البيانات. تحقق من الشبكة ثم أعد المحاولة.',
}) => {
  return <ResponsiveState variant="empty" title={title} description={description} />;
};

export default InternetRequiredState;
