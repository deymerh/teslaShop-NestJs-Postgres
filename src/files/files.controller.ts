import { Response } from 'express';
import { Controller, Post, Get, UseInterceptors, UploadedFile, BadRequestException, Param, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ApiTags } from '@nestjs/swagger';

import { FilesService } from './files.service';
import { fileFilter, fileNamer } from './helpers';
import { ConfigService } from '@nestjs/config';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService
  ) { }

  @Get('product/:imageName')
  findProductImage(
    @Res() response: Response,
    @Param('imageName') imageName: string) {
    const path = this.filesService.getStaticProductImage(imageName);
    response.sendFile(path);
  }

  @Post('product')
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: fileFilter,
    storage: diskStorage({ destination: './static/products', filename: fileNamer }),
    // limits: { fileSize: 1000 }
  }))
  uploadProductImage(@UploadedFile() file: Express.Multer.File) {

    if (!file) throw new BadRequestException('Make sure that the file is a image');

    const secureUrl = ` ${this.configService.get('HOST_API')}/files/product/${file.filename}`;

    return { secureUrl };
  }

}
