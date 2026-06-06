import { Injectable, type OnModuleInit } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { PinoLogger } from 'nestjs-pino';
import { Context, Telegraf } from 'telegraf';
import { BOT_COMMANDS } from './telegram.commands';
import {
  BOT_SHORT_DESCRIPTION,
  getBotProfileDescription,
} from './telegram.messages';

const BOT_PROFILE_LANGUAGE = 'ru';

@Injectable()
export class TelegramBotSetupService implements OnModuleInit {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TelegramBotSetupService.name);
  }

  async onModuleInit(): Promise<void> {
    await this.syncBotCommands();
    await this.syncBotProfile();
  }

  private async syncBotCommands(): Promise<void> {
    try {
      await this.bot.telegram.setMyCommands(BOT_COMMANDS);
      this.logger.info(
        { commands: BOT_COMMANDS.map((cmd) => cmd.command) },
        'Команды бота зарегистрированы',
      );
    } catch (error) {
      this.logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        'Не удалось зарегистрировать команды бота',
      );
    }
  }

  private async syncBotProfile(): Promise<void> {
    const description = getBotProfileDescription();

    try {
      await this.bot.telegram.setMyDescription(
        description,
        BOT_PROFILE_LANGUAGE,
      );
      this.logger.info(
        { language: BOT_PROFILE_LANGUAGE, length: description.length },
        'Описание бота (пустой чат) обновлено',
      );
    } catch (error) {
      this.logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        'Не удалось обновить описание бота',
      );
    }

    try {
      await this.bot.telegram.setMyShortDescription(
        BOT_SHORT_DESCRIPTION,
        BOT_PROFILE_LANGUAGE,
      );
      this.logger.info(
        {
          language: BOT_PROFILE_LANGUAGE,
          length: BOT_SHORT_DESCRIPTION.length,
        },
        'Краткое описание бота обновлено',
      );
    } catch (error) {
      this.logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        'Не удалось обновить краткое описание бота',
      );
    }
  }
}
