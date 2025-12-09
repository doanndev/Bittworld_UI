"use client";

import React from 'react';
import { Link2, Twitter } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const footerLinks = [
        {
            name: "BITTWORLD CEX",
            icon: Link2,
            href: "https://www.bittworld.com",
        },
        {
            name: "BITTWORLD TWITTER",
            icon: Twitter,
            href: "https://x.com/BittWorld776",
        }
    ];

    return (
        <footer className="bg-black dark:bg-gray-800 w-full py-4 sm:py-6 lg:py-4 lg:py-6 border-t border-gray-200 dark:border-gray-800 mt-10 h-20 pb-36 sm:pb-32 lg:pb-6">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Copyright */}
                    <div className="text-xs sm:text-sm text-theme-primary-500 dark:text-gray-400 font-bold">
                        © {currentYear} Bittworld. All rights reserved.
                    </div>

                    {/* Links */}
                    <nav className="flex items-center gap-4 sm:gap-6">
                        {footerLinks.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <a
                                    key={index}
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs sm:text-sm text-theme-primary-500 font-bold dark:text-gray-400 hover:text-theme-primary-500 dark:hover:text-theme-primary-400 transition-colors duration-200"
                                >
                                    <Icon className="w-4 h-4" />
                                </a>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
