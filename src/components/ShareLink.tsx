"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CopyIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  FaXTwitter,
  FaWhatsapp,
  FaFacebookF,
  FaLinkedinIn,
} from "react-icons/fa6";
import { Share } from "lucide-react";

type Link = {
  link: string;
};

const ShareLinkModal = ({ link }: Link) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Social media sharing URLs
  const socialShareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(link)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Link Copied",
        description: "The link has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy link.",
        variant: "destructive",
      });
    }
  };

  // Open social media share link
  const handleSocialShare = (platform: any) => {
    window.open(socialShareLinks[platform], "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Share />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl  p-6  bg-black border-[1px] border-gray-700">
        <DialogHeader>
          <DialogTitle>Share this Link</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          <div className="flex flex-wrap justify-start gap-2">
            {/* Social Media Share Buttons */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleSocialShare("twitter")}
              className="hover:bg-gray-400 w-16 h-16 bg-black text-white border-[1px] border-gray-700"
            >
              <FaXTwitter />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleSocialShare("whatsapp")}
              className="hover:bg-gray-400 w-16 h-16 bg-black text-white border-[1px] border-gray-700"
            >
              <FaWhatsapp />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleSocialShare("facebook")}
              className="hover:bg-gray-400 w-16 h-16 bg-black text-white border-[1px] border-gray-700"
            >
              <FaFacebookF />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleSocialShare("linkedin")}
              className="hover:bg-gray-400 w-16 h-16 bg-black text-white border-[1px] border-gray-700"
            >
              <FaLinkedinIn />
            </Button>
          </div>

          {/* Copy Link Section */}
          <div className="flex items-center space-x-2">
            <div className="flex-grow p-2 border rounded-md text-sm text-gray-600 truncate border-[1px] border-gray-700">
              {link}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
              className="hover:bg-gray-400 bg-black text-white border-[1px] border-gray-700"
            >
              <CopyIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareLinkModal;
