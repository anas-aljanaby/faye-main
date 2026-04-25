export type AccessRole = 'team_member' | 'sponsor';

export interface AccessPermissions {
  can_edit_orphans?: boolean | null;
  can_edit_sponsors?: boolean | null;
  can_edit_transactions?: boolean | null;
  can_create_expense?: boolean | null;
  can_approve_expense?: boolean | null;
  can_view_financials?: boolean | null;
  is_manager?: boolean | null;
}

export interface AccessContext {
  role?: AccessRole | null;
  permissions?: AccessPermissions | null;
  isSystemAdmin?: boolean;
}

const isTeamMember = (role?: AccessRole | null) => role === 'team_member';
const isSponsor = (role?: AccessRole | null) => role === 'sponsor';
const hasManagerAccess = (context: AccessContext) =>
  context.isSystemAdmin === true || context.permissions?.is_manager === true;

export const canAccessOrphans = (context: AccessContext) => {
  if (isSponsor(context.role)) {
    return true;
  }

  if (!isTeamMember(context.role)) {
    return false;
  }

  return hasManagerAccess(context) || context.permissions?.can_edit_orphans === true;
};

export const canAccessSponsors = (context: AccessContext) => {
  if (!isTeamMember(context.role)) {
    return false;
  }

  return hasManagerAccess(context) || context.permissions?.can_edit_sponsors === true;
};

export const canAccessSponsorProfiles = (context: AccessContext) => {
  if (isSponsor(context.role)) {
    return true;
  }

  return canAccessSponsors(context);
};

export const canAccessFinancialSystem = (context: AccessContext) => {
  if (!isTeamMember(context.role)) {
    return false;
  }

  if (hasManagerAccess(context)) {
    return true;
  }

  return (
    context.permissions?.can_view_financials === true ||
    context.permissions?.can_create_expense === true ||
    context.permissions?.can_approve_expense === true ||
    context.permissions?.can_edit_transactions === true
  );
};

export const canAccessOrphanFinancials = (context: AccessContext) => {
  if (isSponsor(context.role)) {
    return true;
  }

  return canAccessFinancialSystem(context);
};
