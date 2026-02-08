import React from 'react';
import { X, User as UserIcon } from 'lucide-react';
import { MOCK_USERS } from '../constants';
import { User } from '../types';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({ isOpen, onClose, onSelectUser }) => {
  if (!isOpen) return null;

  // Filter for specific roles to display as options
  const personas = [
    { ...MOCK_USERS[0], label: 'Board Member (Admin)' }, // Liji
    { ...MOCK_USERS[2], label: 'Donor' },               // Donor1
    { ...MOCK_USERS[3], label: 'Standard User' }        // User1
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="text-gray-600 font-medium">Sign in with Google</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Choose an account</h3>
          <p className="text-sm text-gray-500 mb-6">to continue to Aaria's Blue Elephant</p>
          
          <div className="space-y-3">
            {personas.map((user) => (
              <button
                key={user.email}
                onClick={() => onSelectUser(user)}
                className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all text-left group"
              >
                <div className="h-10 w-10 rounded-full bg-brand-cyan/20 flex items-center justify-center text-brand-cyan font-bold shrink-0 group-hover:bg-brand-cyan group-hover:text-white transition-colors">
                   {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  <p className="text-xs text-brand-purple font-medium mt-0.5">{user.label}</p>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100">
             <button className="text-sm text-gray-600 font-medium flex items-center gap-2">
                <div className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                </div>
                Use another account
             </button>
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 text-xs text-gray-500 flex justify-between">
            <span>English (United States)</span>
            <div className="space-x-4">
                <span>Help</span>
                <span>Privacy</span>
                <span>Terms</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleAuthModal;