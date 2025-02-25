export interface Message {
    id: string
    content: string
    sender: 'user' | 'admin' | 'bot'
    timestamp: string
    status?: string
    metadata?: string
} 