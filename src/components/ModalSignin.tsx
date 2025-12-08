"use client"
import { useLang } from "@/lang";
import React, { useState } from "react";
import { useTermsAcceptance } from "@/hooks/useTermsAcceptance";
import TermsOfServiceModal from "./TermsOfServiceModal";
import { Checkbox } from "@/ui/checkbox";

interface ModalSigninProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalSignin({ isOpen, onClose }: ModalSigninProps) {
  const { t } = useLang();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isTermsChecked, setIsTermsChecked] = useState(false);
  const { termsAccepted, isLoading } = useTermsAcceptance();

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    if (!isTermsChecked) {
      setShowTermsModal(true);
      return;
    }
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI}&response_type=code&scope=email%20profile&access_type=offline`
  }


  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleTermsAccept = () => {
    setIsTermsChecked(true);
    setShowTermsModal(false);
  };

  const handleTermsDecline = () => {
    setIsTermsChecked(false);
    setShowTermsModal(false);
  };

  const handleCheckboxClick = () => {
    setShowTermsModal(true);
  };

  if (isLoading) {
    return (
      <div 
        className="fixed inset-0 top-16 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50"
        onClick={handleOverlayClick}
      >
        <div className="py-5 px-8 bg-white mx-2 dark:bg-stone-950 rounded-lg shadow-[0px_0px_4px_0px_rgba(232,232,232,0.50)] dark:shadow-[0px_0px_4px_0px_rgba(0,0,0,0.50)] outline outline-1 outline-offset-[-1px] outline-theme-primary-500 backdrop-blur-[5px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="fixed inset-0 top-16 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50"
        onClick={handleOverlayClick}
      >
        <div className="py-5 px-10  bg-white mx-2 dark:bg-stone-950 rounded-lg shadow-[0px_0px_4px_0px_rgba(232,232,232,0.50)] dark:shadow-[0px_0px_4px_0px_rgba(0,0,0,0.50)] outline outline-1 outline-offset-[-1px] outline-theme-primary-500 backdrop-blur-[5px] inline-flex justify-start items-end gap-1">
          <div className="w-full inline-flex flex-col justify-start items-center gap-4">
            <div className="self-stretch inline-flex justify-between items-center">
              <div className="justify-start text-theme-primary-500 dark:text-theme-primary-500 text-lg font-semibold uppercase leading-relaxed">
                {t('header.wallet.connect')}
              </div>
            </div>
            <div className="flex flex-col justify-start items-center gap-1.5">
              <div className="justify-start text-gray-900 dark:text-white text-lg font-medium uppercase leading-relaxed">
                {t('header.wallet.welcome')}
              </div>
            </div>
            
            <div className="flex justify-center items-center gap-2">
              <Checkbox 
                id="terms-of-service" 
                className="w-4 h-4" 
                checked={isTermsChecked}
                onClick={handleCheckboxClick}
              />
              <button 
                className="text-xs" 
                onClick={handleCheckboxClick}
              >
                {t('modalSignin.agreeToTerms')} <span className="text-theme-primary-500">{t('modalSignin.termsOfService')}</span> {t('modalSignin.ofBittworld')}
              </button>
            </div>
            
            <div className="inline-flex justify-start items-center gap-4 md:gap-20 mb-4">
              <div
                data-property-1="Frame 427320434"
              >
                <button 
                  onClick={handleGoogleSignIn} 
                  disabled={!isTermsChecked}
                  className={`text-center text-gray-900 h-10 min-w-48 text-sm font-normal leading-tight flex items-center gap-2 justify-center rounded-md ${
                    isTermsChecked 
                      ? 'bg-theme-primary-500 dark:text-white hover:bg-theme-primary-600' 
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {t('modalSignin.loginWithGoogle')} <div className="w-8 h-8 overflow-hidden cursor-pointer rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800" onClick={handleGoogleSignIn}>
                    <img
                      src="https://img.icons8.com/color/48/google-logo.png"
                      alt="google" 
                      className="w-6 h-6 object-cover"
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TermsOfServiceModal
        isOpen={showTermsModal}
        onAccept={handleTermsAccept}
        onDecline={handleTermsDecline}
      />
    </>
  );
}
