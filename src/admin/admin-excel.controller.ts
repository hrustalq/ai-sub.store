import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { ApiCommonResponses } from '../common/decorators/api-responses.decorator';
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard';
import { ExcelImportResultSchema } from '../entities/schemas';
import { ExcelService } from './excel.service';
import { ExcelTypeParamDto } from './dto/excel-type-param.dto';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@ApiTags('Администрирование — Excel')
@ApiSecurity('admin-api-key')
@ApiCommonResponses()
@Controller('api/admin/excel')
@UseGuards(AdminApiKeyGuard)
export class AdminExcelController {
  constructor(private readonly excel: ExcelService) {}

  @Get('templates/:type')
  @ApiOperation({ summary: 'Скачать Excel-шаблон для импорта' })
  @ApiProduces(XLSX_MIME)
  async downloadTemplate(
    @Param() params: ExcelTypeParamDto,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.excel.generateTemplate(params.type);
    const filename = this.excel.getTemplateFilename(params.type);
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Post('import/:type')
  @ApiOperation({ summary: 'Импорт данных из Excel-файла' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Excel-файл (.xlsx) по шаблону',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Результат импорта',
    type: ExcelImportResultSchema,
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed =
          file.mimetype === XLSX_MIME ||
          file.originalname.toLowerCase().endsWith('.xlsx');
        cb(null, allowed);
      },
    }),
  )
  async importFile(
    @Param() params: ExcelTypeParamDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException(
        'Загрузите файл .xlsx в поле file (макс. 5 МБ)',
      );
    }
    return this.excel.importFromBuffer(params.type, file.buffer);
  }
}
