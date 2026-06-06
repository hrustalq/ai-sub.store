import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LegalDocument,
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
} from './legal.content';

export type LegalDocumentId = 'privacy' | 'terms';

const TELEGRAM_CHUNK_LIMIT = 4000;

@Injectable()
export class LegalService {
  constructor(private readonly config: ConfigService) {}

  getDocument(id: LegalDocumentId): LegalDocument {
    return id === 'privacy' ? PRIVACY_POLICY : TERMS_OF_SERVICE;
  }

  getPublicUrl(path: string): string | null {
    const base =
      this.config.get<string>('publicBaseUrl') ??
      this.config.get<string>('telegram.webhookDomain');
    if (!base) {
      return null;
    }
    const normalizedBase = base.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
  }

  formatTelegramText(document: LegalDocument): string {
    const header = [
      `*${document.title}*`,
      `_Обновлено: ${document.updatedAt}_`,
      '',
    ];
    const body = document.sections.flatMap((section) => [
      `*${section.title}*`,
      ...section.paragraphs,
      '',
    ]);
    return [...header, ...body].join('\n').trimEnd();
  }

  getTelegramIntro(id: LegalDocumentId): string {
    const document = this.getDocument(id);
    return [
      `📄 *${document.title}*`,
      `_Обновлено: ${document.updatedAt}_`,
    ].join('\n');
  }

  chunkForTelegram(text: string): string[] {
    if (text.length <= TELEGRAM_CHUNK_LIMIT) {
      return [text];
    }

    const chunks: string[] = [];
    const paragraphs = text.split('\n\n');
    let current = '';

    for (const paragraph of paragraphs) {
      const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
      if (candidate.length <= TELEGRAM_CHUNK_LIMIT) {
        current = candidate;
        continue;
      }

      if (current) {
        chunks.push(current);
      }

      if (paragraph.length <= TELEGRAM_CHUNK_LIMIT) {
        current = paragraph;
        continue;
      }

      let offset = 0;
      while (offset < paragraph.length) {
        chunks.push(paragraph.slice(offset, offset + TELEGRAM_CHUNK_LIMIT));
        offset += TELEGRAM_CHUNK_LIMIT;
      }
      current = '';
    }

    if (current) {
      chunks.push(current);
    }

    return chunks;
  }

  renderHtml(document: LegalDocument): string {
    const sections = document.sections
      .map((section) => {
        const paragraphs = section.paragraphs
          .map((p) => `<p>${this.escapeHtml(p)}</p>`)
          .join('\n');
        return `<section><h2>${this.escapeHtml(section.title)}</h2>${paragraphs}</section>`;
      })
      .join('\n');

    return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${this.escapeHtml(document.title)} — AI Sub Store</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; max-width: 48rem; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; }
    h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
    .meta { color: #666; font-size: 0.9rem; margin-bottom: 2rem; }
    h2 { font-size: 1.15rem; margin-top: 1.5rem; }
    p { margin: 0.5rem 0; }
    footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ddd; font-size: 0.85rem; color: #666; }
  </style>
</head>
<body>
  <article>
    <h1>${this.escapeHtml(document.title)}</h1>
    <p class="meta">AI Sub Store · обновлено ${this.escapeHtml(document.updatedAt)}</p>
    ${sections}
  </article>
  <footer>
    <p>Вопросы: обращение в поддержку через Telegram-бот AI Sub Store.</p>
  </footer>
</body>
</html>`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
