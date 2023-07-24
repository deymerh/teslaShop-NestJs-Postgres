import { ProductsService } from './../products/products.service';
import { Injectable } from '@nestjs/common';
import { initialData } from './data/seed-data';
import { Repository } from 'typeorm';
import { User } from 'src/auth/entities/users.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SeedService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly productsService: ProductsService,
  ) { }

  async runSeed() {
    this.deleteTables();
    const adminUser = await this.insertUsers();
    this.insertNewProducts(adminUser);
    return `This action returns all seed`;
  }

  private async deleteTables() {
    await this.productsService.deleteAllProducts();

    const queryBuilder = this.userRepository.createQueryBuilder();
    await queryBuilder
      .delete()
      .where({})
      .execute()
  }

  private async insertUsers() {

    const seedUsers = initialData.users;

    const users: User[] = [];

    seedUsers.forEach(user => {
      users.push(this.userRepository.create(user))
    });

    const dbUsers = await this.userRepository.save(seedUsers)

    return dbUsers[0];
  }

  private async insertNewProducts(user: User) {
    await this.productsService.deleteAllProducts();

    const myPromises = [];
    initialData.products.forEach((product) => (this.productsService.create(product, user)));
    await Promise.all(myPromises);
    return true;
  }

}
