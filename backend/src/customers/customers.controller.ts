import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Customer } from '@prisma/client';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async getCustomers() {
    return this.customersService.getCustomers();
  }

  @Get(':id')
  async getCustomer(@Param('id') id: string) {
    return this.customersService.getCustomer(id);
  }

  @Get('phone/:phone')
  async getCustomerByPhone(@Param('phone') phone: string) {
    return this.customersService.getCustomerByPhone(phone);
  }

  @Post()
  async createCustomer(@Body() data: Partial<Customer>) {
    return this.customersService.createCustomer(data);
  }

  @Put(':id')
  async updateCustomer(
    @Param('id') id: string,
    @Body() data: Partial<Customer>,
  ) {
    return this.customersService.updateCustomer(id, data);
  }
} 