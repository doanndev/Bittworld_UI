"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/ui/dialog";
import { Button } from "@/ui/button";
import { X } from "lucide-react";

export default function NewYearPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Kiểm tra thời gian đóng popup lần cuối
    const lastClosedTime = localStorage.getItem("newYearPopupLastClosed");
    const currentTime = Date.now();
    const oneHourInMs = 1 * 60 * 60 * 1000; // 1 giờ tính bằng milliseconds

    // Nếu chưa có thời gian đóng hoặc đã qua 1 giờ kể từ lần đóng cuối
    if (!lastClosedTime || (currentTime - parseInt(lastClosedTime)) > oneHourInMs) {
      // Hiển thị popup sau 1 giây để trang load xong
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Lưu thời gian đóng popup
    localStorage.setItem("newYearPopupLastClosed", Date.now().toString());
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        hiddenCloseButton={true} 
        className="md:max-w-[50vh] max-w-[90%] overflow-hidden p-0 border-0 bg-transparent rounded-md" 
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="relative w-full md:max-w-[50vh] rounded-md">
          {/* Nút đóng */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-10 bg-black/50 hover:bg-white/30 text-white rounded-lg w-8 h-8"
            onClick={handleClose}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Hình ảnh chúc mừng năm mới */}
          <div className="relative overflow-hidden rounded-lg">
            <img
              src="/2026.png"
              alt="Happy New Year 2026"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
