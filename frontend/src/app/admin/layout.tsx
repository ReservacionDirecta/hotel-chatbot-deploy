'use client'

import { Sidebar } from '@/components/dashboard/sidebar'
import { MobileNav } from '@/components/dashboard/mobile-nav'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen">
            <div className="hidden md:flex">
                <Sidebar />
            </div>
            <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
                <div className="md:hidden">
                    <MobileNav />
                </div>
            </div>
        </div>
    )
} 