import { v4 as uuid } from 'uuid';

export const fileNamer = (request: Express.Request, file: Express.Multer.File, callback: Function) => {

  if (!file) return callback(new Error('File is empty'));

  const fileExptension = file.mimetype.split('/')[1];

  const fileName = `${uuid()}.${fileExptension}`;

  callback(null, fileName);
}