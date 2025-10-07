import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Card } from '../ui';
import { useAuthStore } from '../../stores/auth.store';
export default function ProtectedRoute({ allowedRoles, children }) {
    const location = useLocation();
    const { user, accessToken, isLoading, fetchUser } = useAuthStore();
    const [isValidating, setIsValidating] = useState(false);
    // On mount and when auth state changes:
    // If user exists but no accessToken, try to validate session by fetching user profile.
    useEffect(() => {
        let mounted = true;
        async function validateSession() {
            try {
                setIsValidating(true);
                await fetchUser?.();
            }
            catch {
                // ignore
            }
            finally {
                if (mounted)
                    setIsValidating(false);
            }
        }
        if (user && !accessToken) {
            validateSession();
        }
        return () => {
            mounted = false;
        };
    }, [user, accessToken, fetchUser]);
    const authenticated = !!user && !!accessToken;
    // Loading state (store loading or local validation in progress)
    if (isLoading || isValidating) {
        return (_jsx("div", { className: "min-h-[50vh] grid place-items-center", children: _jsx(Card, { className: "w-full max-w-sm animate-pulse", padding: "md", children: _jsxs("div", { className: "flex flex-col items-center gap-3 py-6", children: [_jsx("div", { className: "h-10 w-10 rounded-full border-4 border-slate-200 border-t-transparent animate-spin dark:border-slate-700", role: "status", "aria-live": "polite", "aria-label": "Memuat" }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-300", children: "Memuat..." })] }) }) }));
    }
    // Not authenticated: redirect to /login
    if (!authenticated) {
        return _jsx(Navigate, { to: "/login", replace: true, state: { from: location } });
    }
    // Authorized role check (if allowedRoles specified)
    if (allowedRoles && allowedRoles.length > 0) {
        const role = user?.role;
        const isAuthorized = !!role && allowedRoles.includes(role);
        if (!isAuthorized) {
            // Redirect to unauthorized page
            return _jsx(Navigate, { to: "/unauthorized", replace: true, state: { from: location } });
        }
    }
    // Authenticated & authorized: render children or nested routes via Outlet
    return children ? _jsx(_Fragment, { children: children }) : _jsx(Outlet, {});
}
