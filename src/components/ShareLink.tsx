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
import { Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  FaXTwitter,
  FaWhatsapp,
  FaFacebookF,
  FaLinkedinIn,
} from "react-icons/fa6";
import { buttonVariants } from "@/components/ui/button";

// Share2 icon from previous design
const Share2 = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <circle cx="18" cy="5" r="3"></circle>
    <circle cx="6" cy="12" r="3"></circle>
    <circle cx="18" cy="19" r="3"></circle>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
  </svg>
);

type Link = {
  link: string;
};

const ShareLinkModal = ({ link }: Link) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedAnimation, setCopiedAnimation] = useState(false);
  const { toast } = useToast();

  // Social media sharing URLs
  const socialShareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(link)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
  };

  // Social media platform configurations
  const platforms = [
    {
      name: "Twitter",
      icon: <FaXTwitter className="h-5 w-5" />,
      key: "twitter",
      color: "hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2]",
    },
    {
      name: "WhatsApp",
      icon: <FaWhatsapp className="h-5 w-5" />,
      key: "whatsapp",
      color: "hover:bg-[#25D366]/10 hover:text-[#25D366]",
    },
    {
      name: "Facebook",
      icon: <FaFacebookF className="h-5 w-5" />,
      key: "facebook",
      color: "hover:bg-[#1877F2]/10 hover:text-[#1877F2]",
    },
    {
      name: "LinkedIn",
      icon: <FaLinkedinIn className="h-5 w-5" />,
      key: "linkedin",
      color: "hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]",
    },
  ];

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedAnimation(true);

      toast({
        title: "Link Copied",
        description: "The link has been copied to your clipboard.",
      });

      setTimeout(() => setCopiedAnimation(false), 1500);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy link.",
        variant: "destructive",
      });
    }
  };

  // Open social media share link
  const handleSocialShare = (platform: string) => {
    window.open(
      socialShareLinks[platform as keyof typeof socialShareLinks],
      "_blank"
    );
  };

  // Truncate link for display
  const displayLink = () => {
    if (link.length > 30) {
      // Show fewer characters on small screens
      const isMobileView =
        typeof window !== "undefined" && window.innerWidth < 640;
      const startLength = isMobileView ? 15 : 20;
      const endLength = isMobileView ? 5 : 10;

      return `${link.substring(0, startLength)}...${link.substring(link.length - endLength)}`;
    }
    return link;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="p-2 hover:bg-blue-50 rounded-full transition-colors">
          <Share2 className="h-5 w-5 text-gray-600 hover:text-blue-600" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg w-full p-0 bg-white border border-blue-200 rounded-lg overflow-hidden shadow-xl">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-blue-200">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2 text-gray-800">
            <Share2 className="h-5 w-5 text-blue-600" />
            Share this content
          </DialogTitle>
        </div>

        <div className="p-6 space-y-6">
          {/* Social Media Share Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-600">Share via</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {platforms.map((platform) => (
                <div
                  key={platform.key}
                  className="flex flex-col items-center gap-2"
                >
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleSocialShare(platform.key)}
                    className={`w-12 h-12 rounded-full bg-blue-50 text-gray-700 border-blue-200 hover:border-blue-400 ${platform.color} transition-all duration-200`}
                  >
                    {platform.icon}
                  </Button>
                  <span className="text-xs text-gray-600">{platform.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-blue-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 text-gray-600 bg-white">or copy link</span>
            </div>
          </div>

          {/* Copy Link Section */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="flex-grow bg-blue-50 rounded-lg border border-blue-200 p-3 text-sm text-gray-700 font-mono truncate">
              {displayLink()}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className={`h-10 px-3 rounded-md transition-all duration-200 flex-shrink-0 ${
                  copiedAnimation
                    ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                    : "bg-blue-600 border-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {copiedAnimation ? (
                  <span className="text-xs font-medium flex items-center">
                    <Copy className="h-4 w-4 mr-1" /> Copied!
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(link, "_blank")}
                className="h-10 px-3 rounded-md bg-white border-blue-300 hover:bg-blue-50 hover:border-blue-400 flex-shrink-0 text-gray-700"
              >
                <span className="flex items-center">
                  <ExternalLink className="h-4 w-4 mr-1" /> Open
                </span>
              </Button>
            </div>
          </div>

          <p className="text-xs text-gray-600 text-center">
            Anyone with this link can view this content
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareLinkModal;
