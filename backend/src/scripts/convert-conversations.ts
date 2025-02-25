import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parse/sync';

// Mapa de correcciones de palabras con acentos
const accentCorrections: { [key: string]: string } = {
    'dia': 'día',
    'dias': 'días',
    'habitacion': 'habitación',
    'habitaciones': 'habitaciones',
    'estadia': 'estadía',
    'telefono': 'teléfono',
    'numero': 'número',
    'asi': 'así',
    'informacion': 'información',
    'ubicacion': 'ubicación',
    'balcon': 'balcón',
    'playa': 'playa',
    'playas': 'playas',
    'tambien': 'también',
    'podria': 'podría',
    'sera': 'será',
    'esta': 'está',
    'estan': 'están',
    'mas': 'más',
    'solo': 'sólo',
    'aqui': 'aquí',
    'ahi': 'ahí',
    'facil': 'fácil',
    'ademas': 'además',
    'cuanto': 'cuánto',
    'cuando': 'cuándo',
    'como': 'cómo',
    'donde': 'dónde',
    'cual': 'cuál',
    'quien': 'quién',
    'que': 'qué',
    'porque': 'porqué',
    'si': 'sí',
    'aun': 'aún',
    'aca': 'acá',
    'alla': 'allá',
    'podra': 'podrá',
    'tendra': 'tendrá',
    'estaran': 'estarán',
    'seran': 'serán',
    'ire': 'iré',
    'vere': 'veré',
    'enviare': 'enviaré',
    'hare': 'haré',
    'estare': 'estaré'
};

function cleanMessage(content: string): string {
    // Eliminar timestamps y números de teléfono
    content = content.replace(/\[\d{1,2}:\d{2}\s*(?:a\.m\.|p\.m\.),\s*\d{1,2}\/\d{1,2}\/\d{4}\]\s*(?:\+?\d{2,3}\s*\d{3}\s*\d{3}\s*\d{3}:)?/g, '');
    content = content.replace(/Pe.a Linda Bungalows:/g, '');
    
    // Eliminar números de teléfono en varios formatos
    content = content.replace(/\+?\d{2,3}[-\s]?\d{3}[-\s]?\d{3}[-\s]?\d{3}/g, '');
    content = content.replace(/\+?\d{9}/g, '');
    content = content.replace(/\d{3}[-\s]?\d{3}[-\s]?\d{3}/g, '');
    
    // Eliminar emojis y caracteres especiales
    content = content.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    
    // Limpiar mensaje de bienvenida repetitivo
    content = content.replace(/Holaa,? Buen[a\s]*di[a|á]!?\s*[¡]?Te comunicaste con el Hotel Peña Linda!?/gi, 'Hola, bienvenido al hotel Peña Linda.');
    content = content.replace(/Para información sobre estad[i|í]a,?\s*por favor ind[i|í]canos los siguientes datos/gi, '¿Podría proporcionarme la siguiente información para ayudarle mejor?');
    
    // Limpiar otros patrones comunes
    content = content.replace(/ya le cotizo\s*[☺️🏖️✨]*/gi, 'Con gusto le preparo la cotización.');
    content = content.replace(/buen dia,?\s*ya le cotizo\s*[☺️🏖️✨]*/gi, 'Con gusto le preparo la cotización.');
    content = content.replace(/[¡!¿?]/g, '');
    
    // Eliminar caracteres especiales restantes y espacios múltiples
    content = content.replace(/[^\w\s.,()-]/g, ' ');
    content = content.replace(/\s+/g, ' ');
    
    // Corregir palabras con acentos faltantes
    let words = content.split(' ');
    words = words.map(word => {
        const lowerWord = word.toLowerCase();
        return accentCorrections[lowerWord] || word;
    });
    content = words.join(' ');
    
    // Limpiar espacios al inicio y final
    content = content.trim();
    
    return content;
}

function isValidMessage(content: string): boolean {
    if (!content || content.length < 5) return false;
    
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('hola') && content.length < 10) return false;
    if (lowerContent.includes('gracias')) return false;
    if (lowerContent.includes('undefined')) return false;
    if (lowerContent.includes('...')) return false;
    if (lowerContent.includes('nota')) return false;
    if (lowerContent.includes('valido solo')) return false;
    if (lowerContent.includes('tarifa')) return false;
    if (lowerContent.includes('igv')) return false;
    if (lowerContent.includes('total')) return false;
    if (lowerContent.includes('oferta valida')) return false;
    if (lowerContent.includes('promo flash')) return false;
    if (lowerContent.includes('fotos referenciales')) return false;
    if (lowerContent.includes('check in')) return false;
    if (lowerContent.includes('check out')) return false;
    if (lowerContent.includes('wifi')) return false;
    if (lowerContent.includes('directv')) return false;
    if (lowerContent.includes('frigobar')) return false;
    if (lowerContent.includes('mascotas')) return false;
    
    return true;
}

function isAssistantMessage(message: string): boolean {
    // Verificar si el mensaje contiene el patrón de Peña Linda Bungalows
    if (message.includes('Peña Linda Bungalows:')) {
        return true;
    }

    // Verificar si el mensaje NO contiene un número de teléfono al inicio
    const phonePattern = /\[\d{1,2}:\d{2}\s*(?:a\.m\.|p\.m\.),\s*\d{1,2}\/\d{1,2}\/\d{4}\]\s*(?:\+?\d{2,3}\s*\d{3}\s*\d{3}\s*\d{3})/;
    if (phonePattern.test(message)) {
        return false;
    }

    // Patrones específicos del asistente
    const assistantPatterns = [
        'Holaa, Buen dia',
        'Para información sobre estadía',
        'ya le cotizo',
        'Bungalow',
        'Balcón',
        'Tarifa',
        'Total',
        'IGV',
        'Oferta válida',
        'PROMO FLASH',
        'Disponemos de',
        'Nuestros medios de pago',
        'Si desea reservar',
        'Ya hemos registrado tu reserva',
        'Del ',
        'Lamentablemente no',
        'Por favor',
        'Nos encontramos en',
        'Te recomendamos',
        'Con gusto le preparo',
        'Ya le reservo',
        'Recuerde realizar el pago',
        'Quedamos atentos',
        'Le adjunto nuestros pdf',
        'Trabajamos con',
        'Puede reservar el taxi',
        'La boleta o factura',
        'Estimado cliente',
        'Para reservar la móvilidad',
        'Nombre del titular',
        'Teléfono correo',
        'Perfecto',
        'Ok',
        'Si correcto',
        'Ya le confirmo',
        'Todos nuestros bungalows'
    ];
    
    const lowerMessage = message.toLowerCase();
    return assistantPatterns.some(pattern => lowerMessage.includes(pattern.toLowerCase()));
}

function isRelevantConversation(conversation: { role: string; content: string }[]): boolean {
    // Verificar que al menos un mensaje tenga contenido relacionado con reservas o información del hotel
    const hasRelevantContent = conversation.some(msg => {
        const content = msg.content.toLowerCase();
        return (
            content.includes('habitacion') ||
            content.includes('reserv') ||
            content.includes('precio') ||
            content.includes('costo') ||
            content.includes('disponib') ||
            content.includes('fecha') ||
            content.includes('persona') ||
            content.includes('niño') ||
            content.includes('adulto') ||
            content.includes('hotel') ||
            content.includes('bungalow') ||
            content.includes('marzo') ||
            content.includes('febrero') ||
            content.includes('enero')
        );
    });
    
    return hasRelevantContent;
}

function processCSVConversations(records: any[]): { role: string; content: string }[][] {
    const conversations: { role: string; content: string }[][] = [];
    let currentConversation: { role: string; content: string }[] = [];
    let lastMessage = '';
    let lastRole = '';
    let combinedMessage = '';
    let messageCount = 0;
    let lastTimestamp = '';
    
    for (const record of records) {
        const message = record[0]?.trim();
        if (!message) continue;
        
        // Extraer timestamp y número de teléfono si existe
        const timestampMatch = message.match(/\[\d{1,2}:\d{2}\s*(?:a\.m\.|p\.m\.),\s*\d{1,2}\/\d{1,2}\/\d{4}\]/);
        const currentTimestamp = timestampMatch ? timestampMatch[0] : '';
        
        // Si el timestamp es diferente, consideramos que es un nuevo mensaje
        if (currentTimestamp && currentTimestamp !== lastTimestamp) {
            if (combinedMessage) {
                currentConversation.push({
                    role: lastRole,
                    content: combinedMessage.trim()
                });
                combinedMessage = '';
            }
            lastTimestamp = currentTimestamp;
        }
        
        // Determinar si es un mensaje del asistente
        const isAssistant = isAssistantMessage(message);
        const role = isAssistant ? 'assistant' : 'user';
        
        // Limpiar el mensaje
        const cleanedContent = cleanMessage(message);
        
        // Si el mensaje es válido
        if (isValidMessage(cleanedContent)) {
            messageCount++;
            
            // Si el rol es el mismo que el anterior y el timestamp es el mismo, combinamos los mensajes
            if (role === lastRole && (!currentTimestamp || currentTimestamp === lastTimestamp)) {
                combinedMessage = combinedMessage ? `${combinedMessage} ${cleanedContent}` : cleanedContent;
            } else {
                // Si hay un mensaje combinado pendiente, lo agregamos
                if (combinedMessage) {
                    currentConversation.push({
                        role: lastRole,
                        content: combinedMessage.trim()
                    });
                }
                combinedMessage = cleanedContent;
            }
            
            lastRole = role;
            lastMessage = cleanedContent;
        }
        
        // Si encontramos un indicador de fin de conversación o hay muchos mensajes acumulados
        if (message.includes('---') || message.toLowerCase().includes('fin de conversación') || messageCount > 10) {
            // Agregar el último mensaje combinado si existe
            if (combinedMessage) {
                currentConversation.push({
                    role: lastRole,
                    content: combinedMessage.trim()
                });
            }
            
            if (currentConversation.length >= 2 && isRelevantConversation(currentConversation)) {
                conversations.push([...currentConversation]);
            }
            currentConversation = [];
            lastMessage = '';
            lastRole = '';
            combinedMessage = '';
            messageCount = 0;
            lastTimestamp = '';
        }
    }
    
    // Procesar la última conversación si existe
    if (combinedMessage) {
        currentConversation.push({
            role: lastRole,
            content: combinedMessage.trim()
        });
    }
    
    if (currentConversation.length >= 2 && isRelevantConversation(currentConversation)) {
        conversations.push(currentConversation);
    }
    
    return conversations;
}

async function convertConversations() {
    const inputFile = path.join(__dirname, '../../../CHats con clientes - Peña Linda Bungalows.csv');
    const outputFile = path.join(__dirname, '../data/training_conversations.txt');
    
    console.log('Leyendo archivo de entrada:', inputFile);
    
    try {
        const fileContent = fs.readFileSync(inputFile, 'utf-8');
        const records = csv.parse(fileContent, {
            skip_empty_lines: true,
            relax_quotes: true
        });
        
        const conversations = processCSVConversations(records);
        
        // Convertir al formato requerido
        let output = '';
        conversations.forEach(conversation => {
            conversation.forEach(message => {
                const role = message.role === 'user' ? 'Usuario' : 'Asistente';
                output += `${role}: ${message.content}\n`;
            });
            output += '---\n\n';
        });
        
        // Crear el directorio data si no existe
        const dataDir = path.dirname(outputFile);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // Guardar el archivo convertido
        fs.writeFileSync(outputFile, output, 'utf8');
        console.log('Conversiones completadas. Archivo guardado en:', outputFile);
        console.log(`Total de conversaciones procesadas: ${conversations.length}`);
        
    } catch (error) {
        console.error('Error al procesar el archivo:', error);
    }
}

convertConversations().catch(console.error); 