import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    makeInMemoryStore,
    proto
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import { EventEmitter } from 'events'

class WhatsAppService extends EventEmitter {
    private socket: ReturnType<typeof makeWASocket> | null = null
    private store = makeInMemoryStore({})
    private isConnected = false
    private reconnectAttempts = 0
    private readonly maxReconnectAttempts = 5

    constructor() {
        super()
        this.store.readFromFile('./whatsapp-store.json')
        setInterval(() => {
            this.store.writeToFile('./whatsapp-store.json')
        }, 10000)
    }

    async connect(phoneNumber: string): Promise<string> {
        try {
            const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
            
            this.socket = makeWASocket({
                printQRInTerminal: true,
                auth: state,
                getMessage: async (key) => {
                    const msg = await this.store.loadMessage(key.remoteJid!, key.id!)
                    return msg?.message || undefined
                }
            })

            this.store.bind(this.socket.ev)

            // Manejar eventos de conexión
            this.socket.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect } = update

                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut

                    if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnectAttempts++
                        await this.connect(phoneNumber)
                    } else {
                        this.emit('disconnected', 'Desconectado de WhatsApp')
                    }
                } else if (connection === 'open') {
                    this.isConnected = true
                    this.reconnectAttempts = 0
                    this.emit('connected', 'Conectado a WhatsApp')
                }
            })

            // Manejar eventos de credenciales
            this.socket.ev.on('creds.update', saveCreds)

            // Manejar mensajes entrantes
            this.socket.ev.on('messages.upsert', async (m) => {
                const msg = m.messages[0]
                if (!msg.key.fromMe && m.type === 'notify') {
                    await this.handleIncomingMessage(msg)
                }
            })

            return 'Conectando a WhatsApp...'
        } catch (error) {
            console.error('Error al conectar con WhatsApp:', error)
            throw new Error('Error al conectar con WhatsApp')
        }
    }

    async disconnect(): Promise<void> {
        if (this.socket) {
            await this.socket.logout()
            this.socket = null
            this.isConnected = false
        }
    }

    async sendMessage(to: string, text: string): Promise<void> {
        if (!this.socket || !this.isConnected) {
            throw new Error('No hay conexión con WhatsApp')
        }

        try {
            await this.socket.sendMessage(to, { text })
        } catch (error) {
            console.error('Error al enviar mensaje:', error)
            throw new Error('Error al enviar mensaje')
        }
    }

    private async handleIncomingMessage(msg: proto.IWebMessageInfo): Promise<void> {
        if (!msg.message) return

        const messageContent = msg.message.conversation || 
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption

        if (messageContent) {
            this.emit('message', {
                from: msg.key.remoteJid!,
                content: messageContent,
                timestamp: msg.messageTimestamp as number,
                type: 'text'
            })
        }
    }

    isActive(): boolean {
        return this.isConnected
    }
}

export const whatsappService = new WhatsAppService() 