import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  Injectable,
  Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { validate as isUUID } from 'uuid';

import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDTO } from '../common/dtos/pagination.dto';

@Injectable()
export class ProductsService {

  private readonly loggerError = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ) { }

  async create(createProductDto: CreateProductDto) {
    try {
      const product = this.productRepository.create(createProductDto);
      await this.productRepository.save(product);
      return product;
    } catch (error) {
      this.handleExeptionError(error);
    }
  }

  findAll(paginationDTO: PaginationDTO) {
    const { limit = 10, offset = 0 } = paginationDTO;
    return this.productRepository.find({
      take: limit,
      skip: offset,
      // TODO relaciones
    });
  }

  async findOne(term: string) {
    let product: Product;
    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder();
      product = await queryBuilder
        .where(`UPPER(title) =:title or slug =:slug`, {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        }).getOne();
    }
    if (!product) throw new NotFoundException(`Product with id: ${term} not found!`);
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.preload({ id: id, ...updateProductDto });

    if (!product) throw new NotFoundException(`Product with id: ${id} not found!`);

    try {
      await this.productRepository.save(product);
      return product;
    } catch (error) {
      this.handleExeptionError(error);
    }
  }

  async remove(id: string) {
    try {
      const product = await this.findOne(id);
      await this.productRepository.remove(product);
    } catch (error) {
      throw new NotFoundException(`Product with id: ${id} not found!`);
    }
  }

  private handleExeptionError(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail);

    this.loggerError.error(error);

    throw new InternalServerErrorException('Unexpected error, check logs');

  }
}
