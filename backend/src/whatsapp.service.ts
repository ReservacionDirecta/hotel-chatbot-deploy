import { Injectable } from '@nestjs/common';
import * as whatsapp from 'whatsapp-web.js';

@Injectable()
export class WhatsappService {
    private client: any;

    constructor() {
        this.client = new whatsapp.Client({
            session: {
                WABrowserId: 'your-wabrowserid',
                WASecretBundle: 'your-wasecretbundle',
                WAToken1: 'your-watoken1',
                WAToken2: 'your-watoken2'
            }
        });
    }

    async sendMessage(message: string, number: string) {
        try {
            await this.client.sendMessage(number, message);
        } catch (error) {
            console.error(error);
        }
    }
}
