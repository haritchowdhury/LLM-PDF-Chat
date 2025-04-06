import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import Providers from "@/components/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const metadata: Metadata = {
  title: "aiversety",
  description:
    "Multi Agent Learning Platform. Upload your pdfs and start learning.",
};

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-black">
        <Providers>
          <Header />
          {children}
          <Toaster />
          <Footer />
        </Providers>
      </body>
    </html>
  );
};

export { metadata };
export default Layout;
