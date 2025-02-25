import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Customer, Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async getCustomers() {
    return this.prisma.customer.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async getCustomer(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async getCustomerByPhone(phone: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { phone },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with phone ${phone} not found`);
    }

    return customer;
  }

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    if (!data.name) {
      throw new BadRequestException('Customer name is required');
    }

    const customerData: Prisma.CustomerCreateInput = {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      dni: data.dni || null,
      address: data.address || null,
      nationality: data.nationality || null,
      preferences: data.preferences || null,
      status: data.status || 'active',
    };

    return this.prisma.customer.create({
      data: customerData,
    });
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    const customerData: Prisma.CustomerUpdateInput = {
      name: data.name || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      dni: data.dni || undefined,
      address: data.address || undefined,
      nationality: data.nationality || undefined,
      preferences: data.preferences || undefined,
      status: data.status || undefined,
    };

    return this.prisma.customer.update({
      where: { id },
      data: customerData,
    });
  }
} 