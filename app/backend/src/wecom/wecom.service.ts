import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WecomService {
  private readonly logger = new Logger(WecomService.name);
  // TODO: Replace with your actual WeCom Webhook URL
  // You can get this from the WeCom group bot settings
  private readonly webhookUrl =
    'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY_HERE';

  async sendText(content: string): Promise<void> {
    if (this.webhookUrl.includes('YOUR_KEY_HERE')) {
      this.logger.warn('WeCom Webhook URL is not configured. Skipping notification.');
      return;
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msgtype: 'text',
          text: { content },
        }),
      });
      const data = await response.json();
      if (data.errcode !== 0) {
        this.logger.error(`Failed to send WeCom message: ${data.errmsg}`);
      }
    } catch (error) {
      this.logger.error('Error sending WeCom message', error);
    }
  }

  async sendMarkdown(content: string): Promise<void> {
    if (this.webhookUrl.includes('YOUR_KEY_HERE')) {
      this.logger.warn('WeCom Webhook URL is not configured. Skipping notification.');
      return;
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msgtype: 'markdown',
          markdown: { content },
        }),
      });
      const data = await response.json();
      if (data.errcode !== 0) {
        this.logger.error(`Failed to send WeCom message: ${data.errmsg}`);
      }
    } catch (error) {
      this.logger.error('Error sending WeCom message', error);
    }
  }
}
