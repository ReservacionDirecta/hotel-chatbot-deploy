import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpException, HttpStatus, BadRequestException, Logger } from '@nestjs/common';
import { ScriptsService } from './scripts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

interface CreateScriptDto {
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

interface UpdateScriptDto extends Partial<CreateScriptDto> {}

@Controller('scripts')
@UseGuards(JwtAuthGuard)
export class ScriptsController {
    private readonly logger = new Logger(ScriptsController.name);

    constructor(private readonly scriptsService: ScriptsService) {}

    @Get()
    @ApiOperation({ summary: 'Obtener todos los scripts' })
    @ApiResponse({ status: 200, description: 'Lista de scripts obtenida exitosamente' })
    async findAll() {
        try {
            return await this.scriptsService.findAll();
        } catch (error) {
            this.logger.error('Error al obtener scripts:', error);
            throw new HttpException(
                'Error al obtener los scripts',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Post()
    @ApiOperation({ summary: 'Crear un nuevo script' })
    @ApiResponse({ status: 201, description: 'Script creado exitosamente' })
    async create(@Body() data: CreateScriptDto) {
        try {
            this.validateScriptData(data);
            return await this.scriptsService.create(data);
        } catch (error) {
            this.logger.error('Error al crear script:', error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new HttpException(
                'Error al crear el script',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Put(':id')
    @ApiOperation({ summary: 'Actualizar un script existente' })
    @ApiResponse({ status: 200, description: 'Script actualizado exitosamente' })
    async update(@Param('id') id: string, @Body() data: UpdateScriptDto) {
        try {
            const scriptId = parseInt(id);
            if (isNaN(scriptId)) {
                throw new BadRequestException('ID de script inválido');
            }

            const existingScript = await this.scriptsService.findById(scriptId);
            if (!existingScript) {
                throw new HttpException('Script no encontrado', HttpStatus.NOT_FOUND);
            }

            if (Object.keys(data).length === 0) {
                throw new BadRequestException('No se proporcionaron datos para actualizar');
            }

            this.validateScriptData(data, true);
            return await this.scriptsService.update(scriptId, data);
        } catch (error) {
            this.logger.error(`Error al actualizar script ${id}:`, error);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Error al actualizar el script',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar un script' })
    @ApiResponse({ status: 200, description: 'Script eliminado exitosamente' })
    async delete(@Param('id') id: string) {
        try {
            const scriptId = parseInt(id);
            if (isNaN(scriptId)) {
                throw new BadRequestException('ID de script inválido');
            }

            const existingScript = await this.scriptsService.findById(scriptId);
            if (!existingScript) {
                throw new HttpException('Script no encontrado', HttpStatus.NOT_FOUND);
            }

            return await this.scriptsService.delete(scriptId);
        } catch (error) {
            this.logger.error(`Error al eliminar script ${id}:`, error);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Error al eliminar el script',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.scriptsService.findById(parseInt(id));
    }

    @Post('default')
    @ApiOperation({ summary: 'Create default scripts' })
    async createDefault() {
        return await this.scriptsService.createDefaultScripts();
    }

    @Post('initialize-defaults')
    @UseGuards(JwtAuthGuard)
    async initializeDefaults() {
        try {
          await this.scriptsService.initializeDefaultScripts();
          return { message: 'Scripts predeterminados inicializados correctamente' };
        } catch (error) {
          throw new HttpException('Error al inicializar los scripts predeterminados', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private validateScriptData(data: Partial<CreateScriptDto>, isUpdate = false) {
        if (!isUpdate) {
            if (!data.name?.trim()) {
                throw new BadRequestException('El nombre es requerido');
            }
            if (!data.response?.trim()) {
                throw new BadRequestException('La respuesta es requerida');
            }
            if (!Array.isArray(data.triggers) || data.triggers.length === 0) {
                throw new BadRequestException('Se requiere al menos una palabra clave');
            }
        } else {
            if (data.name !== undefined && !data.name.trim()) {
                throw new BadRequestException('El nombre no puede estar vacío');
            }
            if (data.response !== undefined && !data.response.trim()) {
                throw new BadRequestException('La respuesta no puede estar vacía');
            }
            if (data.triggers !== undefined && (!Array.isArray(data.triggers) || data.triggers.length === 0)) {
                throw new BadRequestException('Se requiere al menos una palabra clave');
            }
        }

        if (data.triggers?.some(trigger => !trigger.trim())) {
            throw new BadRequestException('Las palabras clave no pueden estar vacías');
        }
    }
} 