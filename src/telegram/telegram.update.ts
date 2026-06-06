import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Action, Command, Ctx, On, Start, Update } from 'nestjs-telegraf';
import { Input } from 'telegraf';
import { Context, Markup } from 'telegraf';
import { AdminCounterpartiesService } from '../admin/admin-counterparties.service';
import { AdminPlansService } from '../admin/admin-plans.service';
import { AdminVendorsService } from '../admin/admin-vendors.service';
import { ExcelService } from '../admin/excel.service';
import { CatalogService } from '../catalog/catalog.service';
import { CredentialsService } from '../credentials/credentials.service';
import {
  CredentialEntity,
  ExcelImportType,
  ExcelImportTypeValue,
  OrderEntity,
  OrderStatus,
  SessionScenario,
  SessionStep,
  SupportTicketStatus,
  VendorIdType,
} from '../entities';
import { HelpdeskService } from '../helpdesk/helpdesk.service';
import { LegalService, type LegalDocumentId } from '../legal/legal.service';
import { OrdersService } from '../orders/orders.service';
import { OrderWorkflowService } from '../orders/order-workflow.service';
import { PaymentService } from '../payment/payment.service';
import { YooKassaService } from '../payment/yookassa.service';
import { SessionService } from '../session/session.service';
import { AppEvents, EventsService } from '../events';
import {
  adminChatModeKeyboard,
  adminTicketKeyboard,
  adminTicketsKeyboard,
  confirmOrderKeyboard,
  yookassaPaymentKeyboard,
  legalMenuKeyboard,
  mainMenuKeyboard,
  planKeyboard,
  supportMenuKeyboard,
  vendorKeyboard,
} from './telegram.keyboards';
import { botCommandsHelpMessage } from './telegram.commands';
import {
  adminCounterpartiesKeyboard,
  adminExcelImportKeyboard,
  adminExcelTemplatesKeyboard,
  adminPanelKeyboard,
  adminPlansKeyboard,
  adminVendorsKeyboard,
} from './telegram-admin.keyboards';
import {
  ADMIN_PANEL_MESSAGE,
  adminCounterpartiesListMessage,
  adminExcelImportPromptMessage,
  adminExcelImportResultMessage,
  adminPlansListMessage,
  adminVendorsListMessage,
} from './telegram-admin.messages';
import {
  credentialsMessage,
  orderSummaryMessage,
  yookassaPaymentMessage,
  ordersListMessage,
  planListMessage,
  adminChatModeEnteredMessage,
  adminChatModeExitedMessage,
  adminReplySentMessage,
  adminTicketDetailMessage,
  adminTicketMessagesMessage,
  adminTicketsListMessage,
  sessionStepHintMessage,
  supportDescribeIssueMessage,
  supportFollowUpMessage,
  supportTicketsListMessage,
  LEGAL_MENU_MESSAGE,
  SUPPORT_WELCOME_MESSAGE,
  vendorListMessage,
  WELCOME_MESSAGE,
} from './telegram.messages';

interface BotContext extends Context {
  match?: RegExpExecArray;
}

@Update()
export class TelegramUpdate {
  private readonly logger = new Logger(TelegramUpdate.name);

  constructor(
    private readonly adminVendors: AdminVendorsService,
    private readonly adminPlans: AdminPlansService,
    private readonly adminCounterparties: AdminCounterpartiesService,
    private readonly excel: ExcelService,
    private readonly catalog: CatalogService,
    private readonly orders: OrdersService,
    private readonly orderWorkflow: OrderWorkflowService,
    private readonly credentials: CredentialsService,
    private readonly payment: PaymentService,
    private readonly yookassa: YooKassaService,
    private readonly session: SessionService,
    private readonly helpdesk: HelpdeskService,
    private readonly legal: LegalService,
    private readonly events: EventsService,
    private readonly config: ConfigService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: BotContext): Promise<void> {
    const userId = this.requireUserId(ctx);
    await this.session.reset(userId);
    await ctx.reply(WELCOME_MESSAGE, {
      parse_mode: 'Markdown',
      ...mainMenuKeyboard(),
    });
  }

  @Command('help')
  async onHelp(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.reply(botCommandsHelpMessage(), { parse_mode: 'Markdown' });
  }

  @Command('browse')
  @Action('browse')
  async onBrowse(@Ctx() ctx: BotContext): Promise<void> {
    await this.showVendors(ctx);
  }

  @Command('support')
  @Action('support')
  async onSupport(@Ctx() ctx: BotContext): Promise<void> {
    await this.showSupportMenu(ctx);
  }

  @Command('legal')
  @Action('legal')
  async onLegal(@Ctx() ctx: BotContext): Promise<void> {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }
    await ctx.reply(LEGAL_MENU_MESSAGE, {
      parse_mode: 'Markdown',
      ...legalMenuKeyboard(),
    });
  }

  @Command('privacy')
  @Action('legal:privacy')
  async onPrivacy(@Ctx() ctx: BotContext): Promise<void> {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }
    await this.sendLegalDocument(ctx, 'privacy');
  }

  @Command('terms')
  @Action('legal:terms')
  async onTerms(@Ctx() ctx: BotContext): Promise<void> {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }
    await this.sendLegalDocument(ctx, 'terms');
  }

  @Action('legal:home')
  async onLegalHome(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    const userId = this.requireUserId(ctx);
    await this.session.reset(userId);
    await ctx.reply(WELCOME_MESSAGE, {
      parse_mode: 'Markdown',
      ...mainMenuKeyboard(),
    });
  }

  @Action('support:home')
  async onSupportHome(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    const userId = this.requireUserId(ctx);
    await this.session.reset(userId);
    await ctx.reply(WELCOME_MESSAGE, {
      parse_mode: 'Markdown',
      ...mainMenuKeyboard(),
    });
  }

  @Action('support:new')
  async onSupportNew(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    const userId = this.requireUserId(ctx);
    await this.session.enterScenario(
      userId,
      SessionScenario.HELPDESK,
      SessionStep.DESCRIBING_ISSUE,
    );
    await ctx.reply(supportDescribeIssueMessage(), { parse_mode: 'Markdown' });
  }

  @Action('support:followup')
  async onSupportFollowUp(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    const userId = this.requireUserId(ctx);
    const openTicket = await this.helpdesk.getOpenTicketForUser(userId);
    if (!openTicket) {
      await ctx.reply('Нет открытого обращения. Создайте новое.');
      return;
    }

    await this.session.advanceHelpdesk(userId, SessionStep.DESCRIBING_ISSUE, {
      supportTicketId: openTicket.id,
    });
    await ctx.reply(supportFollowUpMessage(openTicket.id), {
      parse_mode: 'Markdown',
    });
  }

  @Action('support:list')
  async onSupportList(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    const userId = this.requireUserId(ctx);
    const tickets = await this.helpdesk.listByUser(userId);
    const openTicket = await this.helpdesk.getOpenTicketForUser(userId);
    await ctx.reply(supportTicketsListMessage(tickets), {
      parse_mode: 'Markdown',
      ...supportMenuKeyboard(!!openTicket),
    });
  }

  @Command('orders')
  @Action('orders')
  async onOrders(@Ctx() ctx: BotContext): Promise<void> {
    const userId = this.requireUserId(ctx);
    const userOrders = await this.orders.getByUser(userId);
    await ctx.reply(ordersListMessage(userOrders), {
      parse_mode: 'Markdown',
      ...mainMenuKeyboard(),
    });
  }

  @Command('cancel')
  async onCancelCommand(@Ctx() ctx: BotContext): Promise<void> {
    const userId = this.requireUserId(ctx);
    const adminChat = await this.session.getAdminHelpdeskState(userId);
    if (adminChat) {
      await this.exitAdminChatMode(ctx, userId);
      return;
    }

    const adminManage = await this.session.getAdminManageState(userId);
    if (adminManage) {
      await this.session.reset(userId);
      if (this.isAdmin(userId)) {
        await ctx.reply('Импорт отменён.', adminPanelKeyboard());
      } else {
        await ctx.reply('Действие отменено.', mainMenuKeyboard());
      }
      return;
    }

    await this.session.reset(userId);
    await ctx.reply('Выбор отменён.', mainMenuKeyboard());
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext): Promise<void> {
    const message = ctx.message;
    if (!message || !('text' in message)) {
      return;
    }

    if (message.text.startsWith('/')) {
      return;
    }

    const userId = this.requireUserId(ctx);
    const adminManage = await this.session.getAdminManageState(userId);
    if (adminManage?.step === SessionStep.ADMIN_AWAITING_EXCEL) {
      await ctx.reply(
        'Ожидается Excel-файл (.xlsx). Отправьте документ или /cancel.',
      );
      return;
    }

    const adminChat = await this.session.getAdminHelpdeskState(userId);
    if (adminChat?.step === SessionStep.ADMIN_REPLYING) {
      await this.handleAdminChatMessage(ctx, userId, message.text, adminChat);
      return;
    }

    const helpdesk = await this.session.getHelpdeskState(userId);
    if (helpdesk?.step === SessionStep.DESCRIBING_ISSUE) {
      await this.handleSupportMessage(ctx, userId, message.text, helpdesk);
      return;
    }

    const purchase = await this.session.getPurchaseState(userId);
    if (!purchase) {
      await ctx.reply(
        'Используйте /start или кнопки меню.',
        mainMenuKeyboard(),
      );
      return;
    }

    await ctx.reply(sessionStepHintMessage(purchase.step), {
      parse_mode: 'Markdown',
    });
  }

  @Command('admin')
  @Action('admin:panel')
  async onAdminPanel(@Ctx() ctx: BotContext): Promise<void> {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }

    const userId = this.requireUserId(ctx);
    if (!this.isAdmin(userId)) {
      await ctx.reply('Нет доступа.');
      return;
    }

    await this.session.reset(userId);
    await ctx.reply(ADMIN_PANEL_MESSAGE, {
      parse_mode: 'Markdown',
      ...adminPanelKeyboard(),
    });
  }

  @Action('admin:manage:vendors')
  async onAdminManageVendors(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    if (!(await this.requireAdmin(ctx))) {
      return;
    }
    await this.showAdminVendors(ctx);
  }

  @Action('admin:manage:plans')
  async onAdminManagePlans(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    if (!(await this.requireAdmin(ctx))) {
      return;
    }
    await this.showAdminPlans(ctx);
  }

  @Action('admin:manage:counterparties')
  async onAdminManageCounterparties(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    if (!(await this.requireAdmin(ctx))) {
      return;
    }
    await this.showAdminCounterparties(ctx);
  }

  @Action(/^admin:vendor:toggle:(.+)$/)
  async onAdminToggleVendor(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    if (!(await this.requireAdmin(ctx))) {
      return;
    }

    const vendorId = ctx.match![1];
    try {
      const vendor = await this.adminVendors.get(vendorId);
      await this.adminVendors.update(vendorId, { active: !vendor.active });
      await this.showAdminVendors(ctx);
    } catch {
      await ctx.reply('Не удалось изменить статус вендора.');
    }
  }

  @Action(/^admin:plan:toggle:(.+)$/)
  async onAdminTogglePlan(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    if (!(await this.requireAdmin(ctx))) {
      return;
    }

    const planId = ctx.match![1];
    try {
      const plan = await this.adminPlans.get(planId);
      await this.adminPlans.update(planId, { active: !plan.active });
      await this.showAdminPlans(ctx);
    } catch {
      await ctx.reply('Не удалось изменить статус плана.');
    }
  }

  @Action(/^admin:counterparty:toggle:(.+)$/)
  async onAdminToggleCounterparty(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    if (!(await this.requireAdmin(ctx))) {
      return;
    }

    const counterpartyId = ctx.match![1];
    try {
      const item = await this.adminCounterparties.get(counterpartyId);
      await this.adminCounterparties.update(counterpartyId, {
        active: !item.active,
      });
      await this.showAdminCounterparties(ctx);
    } catch {
      await ctx.reply('Не удалось изменить статус контрагента.');
    }
  }

  @Action('admin:excel:templates')
  async onAdminExcelTemplates(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    if (!(await this.requireAdmin(ctx))) {
      return;
    }

    await ctx.reply('*Excel-шаблоны*\n\nВыберите тип данных:', {
      parse_mode: 'Markdown',
      ...adminExcelTemplatesKeyboard(),
    });
  }

  @Action('admin:excel:import')
  async onAdminExcelImportMenu(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    if (!(await this.requireAdmin(ctx))) {
      return;
    }

    await ctx.reply('*Импорт из Excel*\n\nВыберите тип данных:', {
      parse_mode: 'Markdown',
      ...adminExcelImportKeyboard(),
    });
  }

  @Action(/^admin:excel:template:(.+)$/)
  async onAdminExcelTemplate(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    if (!(await this.requireAdmin(ctx))) {
      return;
    }

    const type = ctx.match![1] as ExcelImportTypeValue;
    if (!Object.values(ExcelImportType).includes(type as ExcelImportType)) {
      await ctx.reply('Неизвестный тип шаблона.');
      return;
    }

    try {
      const buffer = await this.excel.generateTemplate(type as ExcelImportType);
      const filename = this.excel.getTemplateFilename(type as ExcelImportType);
      await ctx.replyWithDocument(Input.fromBuffer(buffer, filename));
    } catch (error) {
      this.logger.error('Failed to send Excel template', error);
      await ctx.reply('Не удалось сформировать шаблон.');
    }
  }

  @Action(/^admin:excel:import:(.+)$/)
  async onAdminExcelImportStart(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    const userId = this.requireUserId(ctx);
    if (!this.isAdmin(userId)) {
      await ctx.reply('Нет доступа.');
      return;
    }

    const type = ctx.match![1] as ExcelImportTypeValue;
    if (!Object.values(ExcelImportType).includes(type as ExcelImportType)) {
      await ctx.reply('Неизвестный тип импорта.');
      return;
    }

    await this.session.enterAdminImport(userId, type);
    await ctx.reply(adminExcelImportPromptMessage(type), {
      parse_mode: 'Markdown',
    });
  }

  @On('document')
  async onDocument(@Ctx() ctx: BotContext): Promise<void> {
    const userId = this.requireUserId(ctx);
    const adminManage = await this.session.getAdminManageState(userId);
    if (!adminManage || adminManage.step !== SessionStep.ADMIN_AWAITING_EXCEL) {
      return;
    }
    if (!this.isAdmin(userId)) {
      return;
    }

    const message = ctx.message;
    if (!message || !('document' in message)) {
      return;
    }

    const doc = message.document;
    const filename = doc.file_name?.toLowerCase() ?? '';
    if (!filename.endsWith('.xlsx')) {
      await ctx.reply(
        'Нужен файл в формате .xlsx. Попробуйте снова или /cancel.',
      );
      return;
    }

    const importType = adminManage.context.importType;
    if (!importType) {
      await this.session.reset(userId);
      await ctx.reply('Сессия импорта сброшена. Используйте /admin.');
      return;
    }

    try {
      const fileLink = await ctx.telegram.getFileLink(doc.file_id);
      const response = await fetch(fileLink.href);
      const buffer = Buffer.from(await response.arrayBuffer());
      const result = await this.excel.importFromBuffer(
        importType as ExcelImportType,
        buffer,
      );
      await this.session.reset(userId);
      await ctx.reply(adminExcelImportResultMessage(result), {
        parse_mode: 'Markdown',
        ...adminPanelKeyboard(),
      });
    } catch (error) {
      this.logger.error('Excel import failed', error);
      const text =
        error instanceof Error
          ? error.message
          : 'Не удалось импортировать файл.';
      await ctx.reply(text);
    }
  }

  @Command('tickets')
  @Action('admin:tickets')
  async onAdminTickets(@Ctx() ctx: BotContext): Promise<void> {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }

    const userId = this.requireUserId(ctx);
    if (!this.isAdmin(userId)) {
      await ctx.reply('Нет доступа.');
      return;
    }

    await this.showAdminTickets(ctx);
  }

  @Action(/^admin:ticket:(.+)$/)
  async onAdminTicketDetail(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    const userId = this.requireUserId(ctx);
    if (!this.isAdmin(userId)) {
      await ctx.reply('Нет доступа.');
      return;
    }

    const ticketId = ctx.match![1];
    await this.showAdminTicket(ctx, ticketId);
  }

  @Action(/^admin:msgs:(.+)$/)
  async onAdminTicketMessages(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    const userId = this.requireUserId(ctx);
    if (!this.isAdmin(userId)) {
      await ctx.reply('Нет доступа.');
      return;
    }

    const ticketId = ctx.match![1];
    await this.showAdminTicketMessages(ctx, ticketId);
  }

  @Action(/^admin:chat:(.+)$/)
  async onAdminEnterChat(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    const userId = this.requireUserId(ctx);
    if (!this.isAdmin(userId)) {
      await ctx.reply('Нет доступа.');
      return;
    }

    const ticketId = ctx.match![1];
    await this.enterAdminChatMode(ctx, userId, ticketId);
  }

  @Action('admin:exit')
  async onAdminExitChat(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    const userId = this.requireUserId(ctx);
    if (!this.isAdmin(userId)) {
      await ctx.reply('Нет доступа.');
      return;
    }

    await this.exitAdminChatMode(ctx, userId);
  }

  @Action(/^admin:close:(.+)$/)
  async onAdminCloseTicket(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    const userId = this.requireUserId(ctx);
    if (!this.isAdmin(userId)) {
      await ctx.reply('Нет доступа.');
      return;
    }

    const ticketId = ctx.match![1];
    await this.closeAdminTicket(ctx, userId, ticketId);
  }

  @Command('reply')
  async onAdminReply(@Ctx() ctx: BotContext): Promise<void> {
    const userId = this.requireUserId(ctx);
    if (!this.isAdmin(userId)) {
      await ctx.reply('Нет доступа.');
      return;
    }

    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const parts = text.split(/\s+/);
    const ticketId = parts[1];
    const replyText = parts.slice(2).join(' ').trim();

    if (!ticketId || !replyText) {
      await ctx.reply('Использование: /reply <id-обращения> <текст>');
      return;
    }

    try {
      await this.helpdesk.addAdminReply(ticketId, userId, replyText);
      await ctx.reply('Ответ отправлен пользователю.');
    } catch {
      await ctx.reply('Не удалось отправить ответ. Проверьте ID обращения.');
    }
  }

  @Command('close')
  async onAdminClose(@Ctx() ctx: BotContext): Promise<void> {
    const userId = this.requireUserId(ctx);
    if (!this.isAdmin(userId)) {
      await ctx.reply('Нет доступа.');
      return;
    }

    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const ticketId = text.split(/\s+/)[1];
    if (!ticketId) {
      await ctx.reply('Использование: /close <id-обращения>');
      return;
    }

    try {
      await this.helpdesk.closeTicket(ticketId);
      await ctx.reply('Обращение закрыто.');
    } catch {
      await ctx.reply('Не удалось закрыть обращение. Проверьте ID.');
    }
  }

  @Action('back:vendors')
  async onBackToVendors(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    await this.showVendors(ctx, true);
  }

  @Action('back:plans')
  async onBackToPlans(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    const purchase = await this.session.getPurchaseState(
      this.requireUserId(ctx),
    );
    if (!purchase?.context.vendorId) {
      await this.showVendors(ctx, true);
      return;
    }
    await this.showPlans(ctx, purchase.context.vendorId, true);
  }

  @Action(/^vendor:(.+)$/)
  async onVendorSelect(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    const vendorId = ctx.match![1] as VendorIdType;
    const userId = this.requireUserId(ctx);
    await this.session.advancePurchase(userId, SessionStep.SELECTING_PLAN, {
      vendorId,
      planId: undefined,
      pendingOrderId: undefined,
    });
    await this.showPlans(ctx, vendorId, true);
  }

  @Action(/^plan:(.+)$/)
  async onPlanSelect(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    const planId = ctx.match![1];
    const userId = this.requireUserId(ctx);

    const plan = await this.catalog.getPlan(planId);
    const vendor = plan
      ? await this.catalog.getVendor(plan.vendorId)
      : undefined;

    if (!plan || !vendor) {
      await ctx.reply('План не найден. Попробуйте снова.');
      return;
    }

    const available = await this.credentials.availableCount(plan.id);
    if (available === 0) {
      await ctx.reply(
        'К сожалению, этот план сейчас недоступен. Выберите другой план.',
        planKeyboard(await this.catalog.getPlansForVendor(plan.vendorId)),
      );
      return;
    }

    const chatId = ctx.chat?.id;
    if (!chatId) {
      return;
    }

    const order = await this.orders.create(userId, chatId, planId);
    await this.session.advancePurchase(userId, SessionStep.CONFIRMING_ORDER, {
      vendorId: plan.vendorId,
      planId,
      pendingOrderId: order.id,
    });

    await ctx.reply(orderSummaryMessage(vendor, plan, order.id), {
      parse_mode: 'Markdown',
      ...confirmOrderKeyboard(order.id),
    });
  }

  @Action(/^pay:(.+)$/)
  async onPay(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    const orderId = ctx.match![1];
    const order = await this.orders.get(orderId);

    if (!order) {
      await ctx.reply('Заказ не найден.');
      return;
    }

    const plan = await this.catalog.getPlan(order.planId);
    if (!plan) {
      await ctx.reply('План не найден.');
      return;
    }

    const userId = this.requireUserId(ctx);
    await this.session.advancePurchase(userId, SessionStep.AWAITING_PAYMENT, {
      vendorId: order.vendorId,
      planId: order.planId,
      pendingOrderId: order.id,
    });

    if (!this.payment.isEnabled()) {
      await ctx.reply(
        'Оплата временно недоступна. Обратитесь в поддержку или попробуйте позже.',
      );
      return;
    }

    const chatId = ctx.chat?.id;

    try {
      const amount = this.yookassa.toPaymentAmount(plan);
      const { paymentId, confirmationUrl } = await this.yookassa.createPayment(
        order.id,
        plan,
      );
      await this.orders.setYooKassaPaymentId(order.id, paymentId);

      await ctx.reply(
        yookassaPaymentMessage(
          order.id,
          plan,
          this.yookassa.formatAmountLabel(amount),
        ),
        {
          parse_mode: 'Markdown',
          ...yookassaPaymentKeyboard(confirmationUrl),
        },
      );

      if (chatId) {
        this.events.emit(AppEvents.Payment.YooKassaLinkSent, {
          order,
          plan,
          telegramChatId: chatId,
          paymentId,
          confirmationUrl,
        });
      }
    } catch (error) {
      this.logger.error(
        `YooKassa payment creation failed for order ${order.id}`,
        error,
      );
      await ctx.reply(
        'Не удалось создать ссылку на оплату. Попробуйте позже или обратитесь в поддержку.',
      );
    }
  }

  @Action(/^cancel:(.+)$/)
  async onCancelOrder(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    const orderId = ctx.match![1];
    await this.orders.cancel(orderId);
    const userId = this.requireUserId(ctx);
    await this.session.reset(userId);
    await ctx.reply('Заказ отменён.', mainMenuKeyboard());
  }

  @Command('confirm')
  async onAdminConfirm(@Ctx() ctx: BotContext): Promise<void> {
    const userId = this.requireUserId(ctx);
    if (!this.isAdmin(userId)) {
      await ctx.reply('Нет доступа.');
      return;
    }

    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const orderId = text.split(/\s+/)[1];
    if (!orderId) {
      await ctx.reply('Использование: /confirm <id-заказа>');
      return;
    }

    await this.fulfillAndDeliver(ctx, orderId, 'admin_command');
  }

  private async showSupportMenu(ctx: BotContext): Promise<void> {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }

    const userId = this.requireUserId(ctx);
    const openTicket = await this.helpdesk.getOpenTicketForUser(userId);
    await ctx.reply(SUPPORT_WELCOME_MESSAGE, {
      parse_mode: 'Markdown',
      ...supportMenuKeyboard(!!openTicket),
    });
  }

  private async showAdminTickets(ctx: BotContext): Promise<void> {
    const tickets = await this.helpdesk.listOpen();
    const message = adminTicketsListMessage(tickets);
    const keyboard = adminTicketsKeyboard(tickets);

    if (ctx.callbackQuery?.message) {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        ...keyboard,
      });
      return;
    }

    await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard });
  }

  private async showAdminTicket(
    ctx: BotContext,
    ticketId: string,
  ): Promise<void> {
    const ticket = await this.helpdesk.get(ticketId);
    if (!ticket) {
      await ctx.reply('Обращение не найдено.');
      return;
    }

    await ctx.reply(adminTicketDetailMessage(ticket), {
      parse_mode: 'Markdown',
      ...adminTicketKeyboard(ticketId),
    });
  }

  private async showAdminTicketMessages(
    ctx: BotContext,
    ticketId: string,
  ): Promise<void> {
    const ticket = await this.helpdesk.get(ticketId);
    if (!ticket) {
      await ctx.reply('Обращение не найдено.');
      return;
    }

    const messages = await this.helpdesk.getMessages(ticketId);
    const adminChat = await this.session.getAdminHelpdeskState(
      this.requireUserId(ctx),
    );
    const inChatWithTicket = adminChat?.context.supportTicketId === ticketId;

    await ctx.reply(adminTicketMessagesMessage(ticket, messages), {
      parse_mode: 'Markdown',
      ...(inChatWithTicket
        ? adminChatModeKeyboard(ticketId)
        : adminTicketKeyboard(ticketId)),
    });
  }

  private async enterAdminChatMode(
    ctx: BotContext,
    adminUserId: number,
    ticketId: string,
  ): Promise<void> {
    const ticket = await this.helpdesk.get(ticketId);
    if (!ticket) {
      await ctx.reply('Обращение не найдено.');
      return;
    }

    if (ticket.status === SupportTicketStatus.CLOSED) {
      await ctx.reply('Обращение уже закрыто.');
      return;
    }

    await this.session.enterAdminChat(adminUserId, ticketId);
    await ctx.reply(adminChatModeEnteredMessage(ticket), {
      parse_mode: 'Markdown',
      ...adminChatModeKeyboard(ticketId),
    });
  }

  private async exitAdminChatMode(
    ctx: BotContext,
    adminUserId: number,
  ): Promise<void> {
    const adminChat = await this.session.getAdminHelpdeskState(adminUserId);
    if (!adminChat) {
      await ctx.reply('Вы не в режиме чата.');
      return;
    }

    await this.session.reset(adminUserId);
    await ctx.reply(adminChatModeExitedMessage(), { parse_mode: 'Markdown' });
  }

  private async closeAdminTicket(
    ctx: BotContext,
    adminUserId: number,
    ticketId: string,
  ): Promise<void> {
    try {
      await this.helpdesk.closeTicket(ticketId);
      const adminChat = await this.session.getAdminHelpdeskState(adminUserId);
      if (adminChat?.context.supportTicketId === ticketId) {
        await this.session.reset(adminUserId);
      }

      const openTickets = await this.helpdesk.listOpen();
      await ctx.reply('Обращение закрыто.', adminTicketsKeyboard(openTickets));
    } catch {
      await ctx.reply('Не удалось закрыть обращение. Проверьте ID.');
    }
  }

  private async handleAdminChatMessage(
    ctx: BotContext,
    adminUserId: number,
    text: string,
    adminChat: { context: { supportTicketId?: string } },
  ): Promise<void> {
    const ticketId = adminChat.context.supportTicketId;
    if (!ticketId) {
      await this.session.reset(adminUserId);
      await ctx.reply('Сессия чата сброшена. Используйте /tickets.');
      return;
    }

    try {
      await this.helpdesk.addAdminReply(ticketId, adminUserId, text);
      await ctx.reply(adminReplySentMessage(), {
        ...adminChatModeKeyboard(ticketId),
      });
    } catch {
      await ctx.reply(
        'Не удалось отправить ответ. Проверьте, что обращение открыто.',
        adminChatModeKeyboard(ticketId),
      );
    }
  }

  private async handleSupportMessage(
    ctx: BotContext,
    userId: number,
    text: string,
    helpdesk: { context: { supportTicketId?: string } },
  ): Promise<void> {
    const chatId = ctx.chat?.id;
    if (!chatId) {
      return;
    }

    const relatedOrderId = this.extractOrderId(text);

    try {
      if (helpdesk.context.supportTicketId) {
        await this.helpdesk.addUserMessage(
          helpdesk.context.supportTicketId,
          userId,
          text,
        );
        await ctx.reply(
          'Сообщение добавлено к обращению. Мы ответим в этом чате.',
        );
      } else {
        await this.helpdesk.createTicket(userId, chatId, text, relatedOrderId);
      }

      await this.session.reset(userId);
    } catch (error: unknown) {
      this.logger.error(
        {
          telegramUserId: userId,
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to handle support message',
      );
      await ctx.reply(
        'Не удалось отправить обращение. Попробуйте позже или /cancel.',
      );
    }
  }

  private extractOrderId(text: string): string | undefined {
    const match = text.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
    return match?.[0];
  }

  private async showVendors(ctx: BotContext, edit = false): Promise<void> {
    const userId = this.requireUserId(ctx);
    await this.session.enterScenario(
      userId,
      SessionScenario.PURCHASE,
      SessionStep.SELECTING_VENDOR,
    );
    const vendors = await this.catalog.getVendors();
    const message = vendorListMessage(vendors);
    const keyboard = vendorKeyboard(vendors);

    if (edit && ctx.callbackQuery?.message) {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        ...keyboard,
      });
    } else {
      await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard });
    }
  }

  private async showPlans(
    ctx: BotContext,
    vendorId: VendorIdType,
    edit = false,
  ): Promise<void> {
    const vendor = await this.catalog.getVendor(vendorId);
    if (!vendor) {
      await ctx.reply('Провайдер не найден.');
      return;
    }

    const plans = await this.catalog.getPlansForVendor(vendorId);
    const message = planListMessage(vendor, plans);
    const keyboard = planKeyboard(plans);

    if (edit && ctx.callbackQuery?.message) {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        ...keyboard,
      });
    } else {
      await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard });
    }
  }

  private async fulfillAndDeliver(
    ctx: BotContext,
    orderId: string,
    source: 'admin_command',
  ): Promise<void> {
    const order = await this.orders.get(orderId);
    if (!order) {
      await ctx.reply('Заказ не найден.');
      return;
    }

    if (order.status === OrderStatus.FULFILLED) {
      const credential = await this.credentials.getByOrderId(orderId);
      if (credential) {
        await this.sendCredentials(ctx, order, credential);
      }
      return;
    }

    if (order.status === OrderStatus.CANCELLED) {
      await ctx.reply('Этот заказ был отменён.');
      return;
    }

    try {
      await this.orderWorkflow.confirmPayment(orderId, { source });
    } catch (error) {
      this.logger.error(`Fulfillment failed for order ${orderId}`, error);
      if (
        error instanceof Error &&
        !error.message.includes('inventory exhausted')
      ) {
        await ctx.reply(
          'Не удалось подтвердить оплату. Попробуйте позже или обратитесь в поддержку.',
        );
      }
    }
  }

  private async sendCredentials(
    ctx: BotContext,
    order: OrderEntity,
    credential: CredentialEntity,
  ): Promise<void> {
    const vendor = await this.catalog.getVendor(order.vendorId);
    const plan = await this.catalog.getPlan(order.planId);

    if (!vendor || !plan) {
      await ctx.reply('Ошибка загрузки данных заказа.');
      return;
    }

    await ctx.reply(credentialsMessage(vendor, plan, credential), {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🛒 Купить ещё', 'browse')],
      ]),
    });
  }

  private async sendLegalDocument(
    ctx: BotContext,
    documentId: LegalDocumentId,
  ): Promise<void> {
    const document = this.legal.getDocument(documentId);
    let text = this.legal.formatTelegramText(document);
    const publicUrl = this.legal.getPublicUrl(`/legal/${documentId}`);
    if (publicUrl) {
      text = `${text}\n\nПолная версия: ${publicUrl}`;
    }

    const chunks = this.legal.chunkForTelegram(text);
    for (let index = 0; index < chunks.length; index += 1) {
      const isLast = index === chunks.length - 1;
      await ctx.reply(chunks[index], {
        parse_mode: 'Markdown',
        ...(isLast ? legalMenuKeyboard() : {}),
      });
    }
  }

  private async requireAdmin(ctx: BotContext): Promise<boolean> {
    const userId = this.requireUserId(ctx);
    if (!this.isAdmin(userId)) {
      await ctx.reply('Нет доступа.');
      return false;
    }
    return true;
  }

  private async showAdminVendors(ctx: BotContext): Promise<void> {
    const vendors = await this.adminVendors.list(true);
    const message = adminVendorsListMessage(vendors);
    const keyboard = adminVendorsKeyboard(vendors);

    if (ctx.callbackQuery?.message) {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        ...keyboard,
      });
      return;
    }

    await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard });
  }

  private async showAdminPlans(ctx: BotContext): Promise<void> {
    const plans = await this.adminPlans.list(undefined, true);
    const message = adminPlansListMessage(plans);
    const keyboard = adminPlansKeyboard(plans);

    if (ctx.callbackQuery?.message) {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        ...keyboard,
      });
      return;
    }

    await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard });
  }

  private async showAdminCounterparties(ctx: BotContext): Promise<void> {
    const items = await this.adminCounterparties.list(true);
    const message = adminCounterpartiesListMessage(items);
    const keyboard = adminCounterpartiesKeyboard(items);

    if (ctx.callbackQuery?.message) {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        ...keyboard,
      });
      return;
    }

    await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard });
  }

  private requireUserId(ctx: BotContext): number {
    const userId = ctx.from?.id;
    if (!userId) {
      throw new Error('Missing Telegram user id');
    }
    return userId;
  }

  private isAdmin(telegramUserId: number): boolean {
    const raw = this.config.get<string>('ADMIN_TELEGRAM_IDS', '');
    const adminIds = raw
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .map(Number);
    return adminIds.includes(telegramUserId);
  }
}
