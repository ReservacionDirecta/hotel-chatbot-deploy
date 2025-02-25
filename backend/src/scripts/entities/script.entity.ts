export class Script {
    id: string;
    name: string;
    title: string;
    content: string;
    category: string;
    active: boolean;
    triggers: string[] | string;
    response: string;
    createdAt: Date;
    updatedAt: Date;
} 