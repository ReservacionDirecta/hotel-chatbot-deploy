import { Test } from '@nestjs/testing';
import { HotelService } from '../hotel/hotel.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HotelService', () => {
  let hotelService: HotelService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        HotelService,
        {
          provide: PrismaService,
          useValue: {
            hotelInfo: {
              findFirst: jest.fn().mockResolvedValue({
                id: 1,
                name: 'Hotel Demo',
                address: '123 Main Street',
                phone: '+1234567890',
              }),
            },
          },
        },
      ],
    }).compile();

    hotelService = moduleRef.get<HotelService>(HotelService);
    prismaService = moduleRef.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(hotelService).toBeDefined();
  });

  it('should return hotel info', async () => {
    const result = await hotelService.getHotelInfo();
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('address');
  });
});
