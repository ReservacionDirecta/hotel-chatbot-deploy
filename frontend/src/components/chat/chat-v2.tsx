import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { MessageItem } from './MessageItem';

const ChatV2: React.FC = () => {
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = React.useState([]);
    const [newMessage, setNewMessage] = React.useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-4 py-4" ref={messagesContainerRef}>
                {messages.map((message, index) => (
                    <MessageItem
                        key={message.id || `temp-${index}`}
                        message={message}
                        isLast={index === messages.length - 1}
                    />
                ))}
            </div>
            <div className="flex-none px-4 py-3 bg-background border-t">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        type="text"
                        placeholder="Escribe un mensaje..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ChatV2; 