import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

const PermissionDenied: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 rounded-full bg-red-500/10 p-6 ring-1 ring-red-500/20">
        <ShieldAlert className="h-16 w-16 text-red-500" />
      </div>
      <h1 className="mb-4 text-3xl font-bold text-white">Access Restricted</h1>
      <p className="mb-8 max-w-md text-lg text-slate-400">
        This area is restricted to Board Members only. You do not have the necessary permissions to view this content.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link to="/">
          <Button variant="secondary">
            <ArrowLeft className="mr-2 h-4 w-4" /> Return Home
          </Button>
        </Link>
        <Button variant="outline" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </div>
    </div>
  );
};

export default PermissionDenied;