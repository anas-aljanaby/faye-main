import React from 'react';
import ResponsiveState from '../ResponsiveState';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { buildOrganizationAppUrl, getOrganizationById } from '../../config/organizations';

interface OrganizationAccessStateProps {
  userOrganizationId?: string;
}

const OrganizationAccessState: React.FC<OrganizationAccessStateProps> = ({ userOrganizationId }) => {
  const { signOut } = useAuth();
  const { organization } = useOrganization();

  const userOrganization = userOrganizationId ? getOrganizationById(userOrganizationId) : null;
  const destinationUrl = userOrganization ? buildOrganizationAppUrl(userOrganization) : null;

  return (
    <ResponsiveState
      variant="error"
      fullScreen
      title="هذا الحساب يتبع نطاق منظمة آخر"
      description={
        userOrganization
          ? `الحساب الحالي مرتبط بمنظمة ${userOrganization.name} بينما النطاق المفتوح الآن هو ${organization.name}. افتح النطاق الصحيح للمتابعة.`
          : 'تم تسجيل الدخول بحساب تابع لمنظمة أخرى غير المرتبطة بهذا النطاق. افتح نطاق المنظمة الصحيح أو سجّل الخروج.'
      }
    >
      <div className="mt-6 flex w-full flex-col gap-3">
        {destinationUrl ? (
          <button
            type="button"
            onClick={() => window.location.assign(destinationUrl)}
            className="min-h-[48px] rounded-xl bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            فتح نطاق المنظمة الصحيحة
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void signOut()}
          className="min-h-[48px] rounded-xl border border-gray-300 px-4 py-3 font-semibold text-text-secondary transition-colors hover:bg-gray-50"
        >
          تسجيل الخروج
        </button>
      </div>
    </ResponsiveState>
  );
};

export default OrganizationAccessState;
