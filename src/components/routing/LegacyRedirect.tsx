import { Navigate, useParams } from 'react-router-dom';

interface LegacyRedirectProps {
  to: string;
}

/**
 * Redirects legacy routes with dynamic params to new dashboard routes.
 * Replaces :param in the target path with actual param values.
 */
export function LegacyRedirect({ to }: LegacyRedirectProps) {
  const params = useParams();
  
  // Replace any :param placeholders in the target path with actual values
  let targetPath = to;
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      targetPath = targetPath.replace(`:${key}`, value);
    }
  });
  
  return <Navigate to={targetPath} replace />;
}
