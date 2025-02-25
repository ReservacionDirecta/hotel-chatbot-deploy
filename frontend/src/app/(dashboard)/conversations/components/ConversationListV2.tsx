import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Conversation {
    id: string;
    name: string;
    lastMessage: string;
    lastMessageAt: string;
}

interface ConversationListProps {
    conversations: Conversation[];
    onSelectConversation: (conversation: Conversation) => void;
    selectedId?: string;
}

export function ConversationListV2({ conversations, onSelectConversation, selectedId }: ConversationListProps) {
    return (
        <Card className="flex flex-col h-full">
            <div className="flex-none px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Conversaciones</h3>
                    <span className="text-xs text-muted-foreground">
                        {conversations.length} activas
                    </span>
                </div>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {conversations.map((conversation) => (
                        <div
                            key={conversation.id}
                            className={`p-2.5 rounded-lg cursor-pointer transition-colors ${selectedId === conversation.id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-accent'
                                }`}
                            onClick={() => onSelectConversation(conversation)}
                        >
                            <div className="flex justify-between items-start gap-2">
                                <div className="font-medium text-sm truncate">
                                    {conversation.name}
                                </div>
                                <div className="text-[10px] opacity-70 whitespace-nowrap">
                                    {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                                        addSuffix: true,
                                        locale: es
                                    })}
                                </div>
                            </div>
                            <div className="text-xs truncate opacity-70 mt-0.5">
                                {conversation.lastMessage}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </Card>
    );
} 