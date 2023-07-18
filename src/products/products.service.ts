import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  Injectable,
  Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { validate as isUUID } from 'uuid';

import { PaginationDTO } from '../common/dtos/pagination.dto';
import { Product, ProductImage } from './entities';
import { CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {

  private readonly loggerError = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource
  ) { }

  async create(createProductDto: CreateProductDto) {
    try {
      const { images = [], ...productDetails } = createProductDto;
      const product = this.productRepository.create({
        ...productDetails,
        images: images.map((image) => this.productImageRepository.create({ url: image }))
      });
      await this.productRepository.save(product);
      return { ...product, images };
    } catch (error) {
      this.handleExeptionError(error);
    }
  }

  async findAll(paginationDTO: PaginationDTO) {
    const { limit = 10, offset = 0 } = paginationDTO;
    const product = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: { images: true }
    });

    return product.map(({ images, ...rest }) => ({ ...rest, images: images.map((img) => img.url) }));
  }

  async findOne(term: string) {
    let product: Product;
    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder('prod');
      product = await queryBuilder
        .where(`UPPER(title) =:title or slug =:slug`, {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        })
        .leftJoinAndSelect('prod.images', 'prodImages')
        .getOne();
    }
    if (!product) throw new NotFoundException(`Product with id: ${term} not found!`);
    return product;
  }

  async findOnePlain(term: string) {
    const { images = [], ...product } = await this.findOne(term);
    return { ...product, images: images.map((image) => (image.url)) };
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const { images, ...productToUpdate } = updateProductDto;

    const product = await this.productRepository.preload({ id, ...productToUpdate });

    if (!product) throw new NotFoundException(`Product with id: ${id} not found!`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      if (images) {
        await queryRunner.manager.delete(ProductImage, { product: { id } });
        product.images = images.map((image) => (this.productImageRepository.create({ url: image })));
      }

      await queryRunner.manager.save(product);
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return this.findOnePlain(id);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
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

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');
    try {
      return await query
        .delete()
        .where({})
        .execute();
    } catch (error) {
      this.handleExeptionError(error);
    }
  }
}
