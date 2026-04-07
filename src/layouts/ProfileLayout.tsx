import { Outlet, Navigate, useLocation } from "react-router-dom";

export default function ProfileLayout() {
  const location = useLocation();
  const basePath = location.pathname.match(/^\/(admin|manager|support)\/account-settings/)?.[0] || "/admin/account-settings";

  if (location.pathname === basePath || location.pathname === `${basePath}/`) {
    return <Navigate to={`${basePath}/personal-info`} replace />;
  }

  return <Outlet />;
}
