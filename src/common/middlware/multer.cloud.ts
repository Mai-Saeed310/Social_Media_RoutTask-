import multer from 'multer';
import  { multer_enum, store_enum } from './../enum/multer.enum';
import { tmpdir } from 'node:os';
import { Request } from 'express';
import { AppError } from '../utiliti/global-error-handling';


const multerCloud = ({
    store_type = store_enum.memory,
    custome_types = multer_enum.image,
    maxFileSize = 5 * 1024 * 1024
}: {
    store_type?: store_enum,
    custome_types?:  string[],
    maxFileSize?: number
}) => {
      const storage = store_type === store_enum.memory ? multer.memoryStorage() : multer.diskStorage({
        destination: tmpdir(),
        filename: function(req: Request, file: Express.Multer.File, cb: Function){
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
            cb(null, uniqueSuffix + "-" + file.originalname)
        }
      })

        function fileFilter(req: Request, file: Express.Multer.File, cb: Function) {
            if (!custome_types.includes(file.mimetype)) {
            cb(new AppError('InValid file type!'))
            } else {
            cb(null, true)
            }
        }

                
        const upload = multer({ storage, fileFilter, limits: { fileSize: maxFileSize } })
        return upload

}


export default multerCloud