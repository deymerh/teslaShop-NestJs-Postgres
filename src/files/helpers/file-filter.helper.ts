
export const fileFilter = (request: Express.Request, file: Express.Multer.File, callback: Function) => {

  if (!file) return callback(new Error('File is empty'));

  const fileExptension = file.mimetype.split('/')[1];
  const validExptension = ['jpg', 'jpeg', 'png', 'gif'];

  if (validExptension.includes(fileExptension)) return callback(null, true);

  callback(null, false);
}