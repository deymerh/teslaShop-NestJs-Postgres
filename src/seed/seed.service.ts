import { ProductsService } from './../products/products.service';
import { Injectable } from '@nestjs/common';
import { initialData } from './data/seed-data';

@Injectable()
export class SeedService {

  constructor(private readonly productsService: ProductsService) { }

  async runSeed() {
    this.insertNewProducts();
    return `This action returns all seed`;
  }

  private async insertNewProducts() {
    await this.productsService.deleteAllProducts();

    const myPromises = [];
    initialData.products.forEach((product) => (this.productsService.create(product)));
    await Promise.all(myPromises);
    return true;
  }

}
