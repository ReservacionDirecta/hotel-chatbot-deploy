import { Metadata } from 'next'
import { DashboardLayout } from '@/components/Layout/dashboard-layout'

export const metadata: Metadata = {
  title: 'Entrenamiento - Hotel Assistant',
  description: 'Página de entrenamiento de IA con historiales de chat'
}

interface TrainingLayoutProps {
  children: React.ReactNode
}

export default function TrainingLayout({ children }: TrainingLayoutProps) {
  return <DashboardLayout>{children}</DashboardLayout>
}
