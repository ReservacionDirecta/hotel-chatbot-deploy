import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Script } from '@prisma/client';

export interface CreateScriptDto {
    name: string;
    description: string;
    active: boolean;
    triggers: string[];
    response: string;
    category?: string;
    requiresDate?: boolean;
    requiresRoomType?: boolean;
    requiresOccupancy?: boolean;
}

export interface UpdateScriptDto extends Partial<CreateScriptDto> {}

@Injectable()
export class ScriptsService {
    private readonly logger = new Logger(ScriptsService.name);

    constructor(private prisma: PrismaService) {}

    async findAll(): Promise<Script[]> {
        try {
            return await this.prisma.script.findMany({
                orderBy: {
                    createdAt: 'desc'
                }
            });
        } catch (error) {
            this.logger.error('Error al obtener scripts:', error);
            throw error;
        }
    }

    async findById(id: number): Promise<Script> {
        try {
            const script = await this.prisma.script.findUnique({
                where: { id }
            });

            if (!script) {
                throw new NotFoundException(`Script con ID ${id} no encontrado`);
            }

            return script;
        } catch (error) {
            this.logger.error(`Error al buscar script ${id}:`, error);
            throw error;
        }
    }

    async create(data: CreateScriptDto): Promise<Script> {
        try {
            return await this.prisma.script.create({
                data: {
                    name: data.name.trim(),
                    description: data.description?.trim() || '',
                    active: data.active ?? true,
                    triggers: JSON.stringify(data.triggers.map(t => t.trim())),
                    response: data.response.trim(),
                    category: data.category?.trim(),
                    requiresDate: data.requiresDate ?? false,
                    requiresRoomType: data.requiresRoomType ?? false,
                    requiresOccupancy: data.requiresOccupancy ?? false
                }
            });
        } catch (error) {
            this.logger.error('Error al crear script:', error);
            throw error;
        }
    }

    async update(id: number, data: UpdateScriptDto): Promise<Script> {
        try {
            // Verificar si el script existe
            await this.findById(id);

            const updateData: any = {};

            // Solo actualizar los campos que se proporcionan
            if (data.name !== undefined) updateData.name = data.name.trim();
            if (data.description !== undefined) updateData.description = data.description.trim();
            if (data.active !== undefined) updateData.active = data.active;
            if (data.triggers !== undefined) updateData.triggers = JSON.stringify(data.triggers.map(t => t.trim()));
            if (data.response !== undefined) updateData.response = data.response.trim();
            if (data.category !== undefined) updateData.category = data.category.trim();
            if (data.requiresDate !== undefined) updateData.requiresDate = data.requiresDate;
            if (data.requiresRoomType !== undefined) updateData.requiresRoomType = data.requiresRoomType;
            if (data.requiresOccupancy !== undefined) updateData.requiresOccupancy = data.requiresOccupancy;

            return await this.prisma.script.update({
                where: { id },
                data: updateData
            });
        } catch (error) {
            this.logger.error(`Error al actualizar script ${id}:`, error);
            throw error;
        }
    }

    async delete(id: number): Promise<Script> {
        try {
            // Verificar si el script existe
            await this.findById(id);

            return await this.prisma.script.delete({
                where: { id }
            });
        } catch (error) {
            this.logger.error(`Error al eliminar script ${id}:`, error);
            throw error;
        }
    }

    async findMatchingScript(input: string): Promise<Script | null> {
        const scripts = await this.prisma.script.findMany({
            where: {
                active: true
            }
        });

        let bestMatch: { script: Script; score: number } | null = null;
        const inputTokens = input.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
            .split(/\s+/)
            .filter(token => token.length > 1); // Ignorar tokens muy cortos

        console.log('Tokens de entrada:', inputTokens);

        for (const script of scripts) {
            try {
                const triggers = JSON.parse(script.triggers);
                
                for (const trigger of triggers) {
                    const triggerTokens = trigger.toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .split(/\s+/)
                        .filter(token => token.length > 1);

                    console.log(`Comparando con trigger "${trigger}":`, triggerTokens);

                    // Primero buscar coincidencia exacta
                    if (input.toLowerCase() === trigger.toLowerCase()) {
                        console.log('¡Coincidencia exacta encontrada!');
                        return script;
                    }

                    // Luego buscar coincidencia parcial
                    let matchScore = 0;
                    let matchedTokens = 0;

                    // Calcular coincidencia de tokens
                    for (const inputToken of inputTokens) {
                        for (const triggerToken of triggerTokens) {
                            if (triggerToken.includes(inputToken) || inputToken.includes(triggerToken)) {
                                matchScore += (inputToken === triggerToken) ? 1 : 0.8;
                                matchedTokens++;
                                break;
                            }
                        }
                    }

                    // Normalizar score basado en la longitud del trigger y la entrada
                    const normalizedScore = matchScore / Math.max(triggerTokens.length, inputTokens.length);
                    console.log(`Score para "${trigger}":`, normalizedScore);

                    // Actualizar mejor coincidencia si es necesario
                    // Reducimos el umbral a 0.4 para ser más permisivos
                    if (normalizedScore > 0.4 && (!bestMatch || normalizedScore > bestMatch.score)) {
                        console.log(`Nueva mejor coincidencia: "${script.name}" con score ${normalizedScore}`);
                        bestMatch = { script, score: normalizedScore };
                    }
                }
            } catch (error) {
                console.error(`Error parsing triggers for script ${script.id}:`, error);
                continue;
            }
        }

        if (bestMatch) {
            console.log(`Coincidencia final: "${bestMatch.script.name}" con score ${bestMatch.score}`);
        } else {
            console.log('No se encontró ninguna coincidencia');
        }

        return bestMatch ? bestMatch.script : null;
    }

    private readonly defaultScripts = [
        {
            name: 'Saludo Inicial',
            description: 'Respuesta al saludo inicial del usuario',
            active: true,
            triggers: JSON.stringify([
                'hola',
                'buenos dias',
                'buenas tardes',
                'buenas noches',
                'buen dia',
                'saludos'
            ]),
            response: `Hola, Buen dia! 😊👋 ¡Te comunicaste con el Hotel Peña Linda! ⛱🍹 

Para información sobre estadia, por favor indicanos los siguientes datos 🥰

* Fecha de check-in y check-out
* Cantidad de personas
* Si hay niños incluir edades`,
            category: 'saludo',
            requiresDate: false,
            requiresRoomType: false,
            requiresOccupancy: false
        },
        {
            name: 'Consulta de Disponibilidad',
            description: 'Respuesta cuando el usuario consulta disponibilidad',
            active: true,
            triggers: JSON.stringify([
                'disponibilidad',
                'hay habitaciones',
                'tienen cuartos',
                'quiero reservar',
                'busco una habitacion',
                'necesito una habitacion'
            ]),
            response: `Para verificar la disponibilidad, necesito los siguientes datos:

📅 Fechas de estadía:
- Check-in
- Check-out

👥 Huéspedes:
- Número de adultos
- Número y edad de niños (si aplica)

🛏️ Preferencias:
- Tipo de habitación (si tiene alguna preferencia)

Por favor, proporciona estos detalles para poder ayudarte mejor. 😊`,
            category: 'reservas',
            requiresDate: true,
            requiresRoomType: true,
            requiresOccupancy: true
        },
        {
            name: 'Ubicación del Hotel',
            description: 'Información sobre la ubicación del hotel',
            active: true,
            triggers: JSON.stringify([
                'donde estan',
                'donde están',
                'donde esta',
                'dónde está',
                'donde se encuentra',
                'dónde se encuentra',
                'ubicacion',
                'ubicación',
                'direccion',
                'dirección',
                'como llego',
                'cómo llego',
                'donde queda',
                'dónde queda'
            ]),
            response: `Nos encontramos en la Antigua Panamericana Norte Km. 1213, entre Las Pocitas y Vichayito en Máncora, Perú. Un lugar ideal para disfrutar de la playa y el sol. 📍 Ubicación en Google Maps: https://maps.app.goo.gl/3s9rG8DxYf4w3oW2A

¿Necesitas indicaciones para llegar o más información sobre nuestra ubicación?`,
            category: 'ubicacion',
            requiresDate: false,
            requiresRoomType: false,
            requiresOccupancy: false
        }
    ];

    async initializeDefaultScripts() {
        try {
            console.log('Initializing default scripts...');
            
            for (const defaultScript of this.defaultScripts) {
                const existingScript = await this.prisma.script.findFirst({
                    where: {
                        name: defaultScript.name
                    }
                });

                if (!existingScript) {
                    console.log(`Creating default script: ${defaultScript.name}`);
                    await this.prisma.script.create({
                        data: defaultScript
                    });
                } else {
                    console.log(`Default script already exists: ${defaultScript.name}`);
                }
            }

            console.log('Default scripts initialization completed');
        } catch (error) {
            console.error('Error initializing default scripts:', error);
            throw new Error('Error al inicializar los scripts predeterminados');
        }
    }

    async createDefaultScripts(): Promise<void> {
        const defaultScripts = [
            {
                name: 'saludo_inicial',
                description: 'Saludo inicial sin contexto',
                active: true,
                triggers: [
                    'hola',
                    'buenos días',
                    'buenos dias',
                    'buen día',
                    'buen dia',
                    'buenas tardes',
                    'buenas noches',
                    'saludos',
                    'hi',
                    'hello'
                ],
                response: '¡Hola! Soy el asistente virtual del Hotel. ¿En qué puedo ayudarte? Puedo brindarte información sobre:\n\n' +
                         '🏨 Nuestras habitaciones y tarifas\n' +
                         '📅 Disponibilidad y reservas\n' +
                         '✨ Servicios y amenidades\n' +
                         '🎉 Ofertas especiales\n\n' +
                         '¿Qué información te gustaría conocer?',
                category: 'general'
            },
            {
                name: 'consulta_informacion',
                description: 'Cliente solicita información general',
                active: true,
                triggers: [
                    'quisiera información',
                    'quisiera informacion',
                    'necesito información',
                    'necesito informacion',
                    'me pueden informar',
                    'información del hotel',
                    'informacion del hotel',
                    'quiero saber'
                ],
                response: 'Con gusto te ayudo. Nuestro hotel ofrece:\n\n' +
                         '🏨 HABITACIONES:\n' +
                         '• Simple: Ideal para viajeros individuales\n' +
                         '• Doble: Perfecta para parejas\n' +
                         '• Suite Junior: Espaciosa con sala de estar\n' +
                         '• Suite Ejecutiva: Nuestra opción más lujosa\n\n' +
                         '💰 TARIFAS:\n' +
                         '• Temporada baja: Desde S/. 250 por noche\n' +
                         '• Temporada alta: Desde S/. 350 por noche\n\n' +
                         '✨ SERVICIOS INCLUIDOS:\n' +
                         '• Desayuno buffet\n' +
                         '• WiFi de alta velocidad\n' +
                         '• Acceso a piscina\n' +
                         '• Gimnasio 24/7\n\n' +
                         '¿Sobre qué aspecto te gustaría más información?',
                category: 'general'
            },
            {
                name: 'consulta_disponibilidad',
                description: 'Consulta de disponibilidad de habitaciones',
                active: true,
                triggers: [
                    'habitaciones disponibles',
                    'hay cuartos',
                    'quiero reservar',
                    'hacer una reserva',
                    'disponibilidad',
                    'tienen habitaciones',
                    'busco alojamiento',
                    'necesito una habitación',
                    'necesito una habitacion',
                    'quisiera reservar',
                    'hay disponibilidad'
                ],
                response: 'Para verificar la disponibilidad exacta, necesito algunos detalles:\n\n' +
                         '📅 ¿Para qué fechas te gustaría reservar?\n' +
                         '👥 ¿Cuántas personas se hospedarán?\n' +
                         '🛏 ¿Qué tipo de habitación prefieres?\n\n' +
                         'Tipos de habitación disponibles:\n' +
                         '• Simple (1-2 personas)\n' +
                         '• Doble (2-3 personas)\n' +
                         '• Suite Junior (2-4 personas)\n' +
                         '• Suite Ejecutiva (2-4 personas)\n\n' +
                         'Por favor, indícame estos detalles para ayudarte mejor.',
                category: 'reservas',
                requiresDate: true,
                requiresOccupancy: true
            },
            {
                name: 'consulta_precios',
                description: 'Información detallada de precios',
                active: true,
                triggers: [
                    'precio',
                    'cuanto cuesta',
                    'tarifa',
                    'precios',
                    'costos',
                    'cuanto sale',
                    'valor de la habitación',
                    'valor de la habitacion',
                    'tarifas',
                    'que precio tienen',
                    'información de precios',
                    'informacion de precios'
                ],
                response: '💰 TARIFAS POR TIPO DE HABITACIÓN:\n\n' +
                         '🏨 Habitación Simple:\n' +
                         '• Temporada baja: S/. 250 por noche\n' +
                         '• Temporada alta: S/. 350 por noche\n\n' +
                         '🏨 Habitación Doble:\n' +
                         '• Temporada baja: S/. 350 por noche\n' +
                         '• Temporada alta: S/. 450 por noche\n\n' +
                         '🏨 Suite Junior:\n' +
                         '• Temporada baja: S/. 450 por noche\n' +
                         '• Temporada alta: S/. 550 por noche\n\n' +
                         '🏨 Suite Ejecutiva:\n' +
                         '• Temporada baja: S/. 550 por noche\n' +
                         '• Temporada alta: S/. 650 por noche\n\n' +
                         '✨ Todos los precios incluyen:\n' +
                         '• Desayuno buffet\n' +
                         '• Acceso a instalaciones\n' +
                         '• WiFi de alta velocidad\n' +
                         '• Impuestos\n\n' +
                         '🎉 OFERTAS ESPECIALES:\n' +
                         '• 15% descuento en estadías de 3+ noches\n' +
                         '• 25% descuento en reservas anticipadas\n\n' +
                         '¿Te gustaría conocer la disponibilidad para alguna de estas opciones?',
                category: 'reservas',
                requiresRoomType: true
            },
            {
                name: 'servicios_amenidades',
                description: 'Información sobre servicios del hotel',
                active: true,
                triggers: [
                    'servicios',
                    'que ofrecen',
                    'amenidades',
                    'facilidades',
                    'que incluye',
                    'beneficios',
                    'comodidades',
                    'instalaciones',
                    'que servicios tienen',
                    'que hay en el hotel'
                ],
                response: '✨ SERVICIOS E INSTALACIONES:\n\n' +
                         '🏊‍♂️ ÁREA DE PISCINA:\n' +
                         '• Piscina infinity con vista al mar\n' +
                         '• Tumbonas y sombrillas\n' +
                         '• Bar en la piscina\n\n' +
                         '🍽 RESTAURANTES Y BARES:\n' +
                         '• Restaurante principal (buffet)\n' +
                         '• Restaurante a la carta\n' +
                         '• Bar en la terraza\n' +
                         '• Servicio a la habitación 24/7\n\n' +
                         '🏊‍♀️ BIENESTAR:\n' +
                         '• Spa completo\n' +
                         '• Sala de masajes\n' +
                         '• Gimnasio 24 horas\n' +
                         '• Sauna y jacuzzi\n\n' +
                         '🎯 ENTRETENIMIENTO:\n' +
                         '• Sala de juegos\n' +
                         '• Área de lectura\n' +
                         '• Actividades diarias\n\n' +
                         '🛎 SERVICIOS ADICIONALES:\n' +
                         '• Recepción 24 horas\n' +
                         '• Concierge\n' +
                         '• WiFi gratuito\n' +
                         '• Estacionamiento\n' +
                         '• Lavandería\n\n' +
                         '¿Te gustaría más detalles sobre alguno de estos servicios?',
                category: 'servicios'
            },
            {
                name: 'proceso_reserva',
                description: 'Información sobre el proceso de reserva',
                active: true,
                triggers: [
                    'como reservo',
                    'como hago la reserva',
                    'proceso de reserva',
                    'pasos para reservar',
                    'que necesito para reservar',
                    'requisitos de reserva',
                    'politica de reserva',
                    'política de reserva'
                ],
                response: '📋 PROCESO DE RESERVA:\n\n' +
                         '1️⃣ CONSULTA Y SELECCIÓN:\n' +
                         '• Verifica disponibilidad para tus fechas\n' +
                         '• Elige el tipo de habitación\n\n' +
                         '2️⃣ DATOS NECESARIOS:\n' +
                         '• Nombre completo\n' +
                         '• DNI o Pasaporte\n' +
                         '• Email\n' +
                         '• Teléfono de contacto\n\n' +
                         '3️⃣ PAGO Y CONFIRMACIÓN:\n' +
                         '• 50% de adelanto para confirmar\n' +
                         '• Saldo al hacer el check-in\n\n' +
                         '⚠️ POLÍTICAS IMPORTANTES:\n' +
                         '• Check-in: 3:00 PM\n' +
                         '• Check-out: 12:00 PM\n' +
                         '• Cancelación gratuita hasta 48h antes\n\n' +
                         '¿Te gustaría proceder con una reserva?',
                category: 'reservas'
            }
        ];

        for (const script of defaultScripts) {
            const exists = await this.prisma.script.findFirst({
                where: { name: script.name }
            });

            if (!exists) {
                await this.prisma.script.create({
                    data: {
                        ...script,
                        triggers: JSON.stringify(script.triggers)
                    }
                });
            }
        }
    }
}