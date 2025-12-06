"use client"
import React, { useState } from 'react';
import { useLang } from "@/lang";
import { useTermsAcceptance } from "@/hooks/useTermsAcceptance";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { ScrollArea } from "@/ui/scroll-area";
import { Separator } from "@/ui/separator";
import Policy from './policy';
import PolicyEn from './policy-en';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function TermsOfServiceModal({ isOpen, onAccept, onDecline }: TermsOfServiceModalProps) {
  const { t, lang } = useLang();
  const { acceptTerms } = useTermsAcceptance();
  const [isAgreed, setIsAgreed] = useState(false);

  const handleAccept = () => {
    acceptTerms();
      onAccept();
  };

  const handleDecline = () => {
    setIsAgreed(false);
    onDecline();
  };

  // Reset checkbox when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setIsAgreed(false);
    }
  }, [isOpen]);

  // Lấy nội dung điều khoản theo ngôn ngữ
  const getTermsContent = () => {
    switch (lang) {
      case 'kr':
        return <Policy />;
      case 'en':
        return <PolicyEn />;
      default:
        return <PolicyEn />; // Fallback to English
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDecline()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col bg-white dark:bg-stone-950">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-theme-primary-500">
            {lang === 'kr' && '이용약관 동의'}
            {lang === 'en' && 'Terms of Service Agreement'}
          </DialogTitle>
        </DialogHeader>
        
        
        <div className="pr-4 overflow-y-auto max-h-[60vh] overflow-x-hidden">
            {getTermsContent()}
          </div>
        
        <div className="space-y-4">
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleDecline}
              className="min-w-[100px] h-8"
            >
              {lang === 'kr' && '거부'}
              {lang === 'en' && 'Decline'}
            </Button>
            <Button
              onClick={handleAccept}
              className="min-w-[100px] h-8 bg-theme-primary-500/70 hover:bg-theme-primary-500"
            >
              {lang === 'kr' && '동의'}
              {lang === 'en' && 'Accept'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 