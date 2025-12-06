"use client"
import React, { useState } from 'react';
import { Button } from "@/ui/button";
import { useTermsAcceptance } from "@/hooks/useTermsAcceptance";
import TermsOfServiceModal from "./TermsOfServiceModal";

export default function TermsDemo() {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const { termsAccepted, isLoading, resetTermsAcceptance } = useTermsAcceptance();

  const handleShowTerms = () => {
    setShowTermsModal(true);
  };

  const handleTermsAccept = () => {
    setShowTermsModal(false);
  };

  const handleTermsDecline = () => {
    setShowTermsModal(false);
  };

  const handleResetTerms = () => {
    resetTermsAcceptance();
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary-500 mx-auto mb-4"></div>
        <p className="text-center">Loading terms status...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-center">Terms of Service Demo</h2>
      
      <div className="space-y-4">
        <div className="text-center">
          <p className="mb-2">Current Status:</p>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            termsAccepted 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {termsAccepted ? 'Terms Accepted' : 'Terms Not Accepted'}
          </span>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={handleShowTerms}
            className="w-full bg-theme-primary-500 hover:bg-theme-primary-600"
          >
            Show Terms of Service
          </Button>
          
          <Button 
            onClick={handleResetTerms}
            variant="outline"
            className="w-full"
          >
            Reset Terms Acceptance
          </Button>
        </div>

        {termsAccepted && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">
              ✅ Terms have been accepted. You can now proceed with login.
            </p>
          </div>
        )}

        {!termsAccepted && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              ⚠️ Terms not accepted. Please accept terms before proceeding.
            </p>
          </div>
        )}
      </div>

      {/* Modal điều khoản sử dụng */}
      <TermsOfServiceModal
        isOpen={showTermsModal}
        onAccept={handleTermsAccept}
        onDecline={handleTermsDecline}
      />
    </div>
  );
} 