import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset, AssetStatus } from '../../entities/asset.entity';
import { License } from '../../entities/license.entity';
import { SettingsService } from '../settings/settings.service';
import OpenAI from 'openai';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);

  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(License)
    private readonly licenseRepository: Repository<License>,
    private readonly settingsService: SettingsService,
  ) {}

  async processCommand(message: string): Promise<any> {
    const apiKey = await this.settingsService.getSetting('OPENAI_API_KEY');
    
    if (!apiKey) {
      return {
        type: 'markdown',
        text: '⚠️ **OpenAI API Key not configured.**\n\nPlease ask an Administrator to configure the `OPENAI_API_KEY` in the AI Configuration settings.',
      };
    }

    const openai = new OpenAI({ apiKey });

    // Define tools
    const tools = [
      {
        type: 'function',
        function: {
          name: 'get_system_stats',
          description: 'Get high-level statistics about total assets, total licenses, and unassigned assets.',
          parameters: { type: 'object', properties: {}, required: [] },
        },
      },
      {
        type: 'function',
        function: {
          name: 'find_asset',
          description: 'Find details of a specific asset by its asset tag or serial number.',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'The asset tag or serial number' },
            },
            required: ['query'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_unassigned_assets',
          description: 'Get a count of all unassigned (In Stock) assets ready for deployment.',
          parameters: { type: 'object', properties: {}, required: [] },
        },
      }
    ];

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an IT Asset Management (ITAM) assistant bot. You help administrators query asset information. Format your responses in clean Markdown. Use tables or lists when appropriate.' },
          { role: 'user', content: message }
        ],
        tools: tools as any,
        tool_choice: 'auto',
      });

      const responseMessage = completion.choices[0].message;

      if (responseMessage.tool_calls) {
        const toolCalls = responseMessage.tool_calls;
        const messages: any[] = [
          { role: 'system', content: 'You are an IT Asset Management (ITAM) assistant bot.' },
          { role: 'user', content: message },
          responseMessage,
        ];

        for (const toolCall of toolCalls) {
          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);
          let functionResult;

          if (functionName === 'get_system_stats') {
            functionResult = await this.getSystemStatsData();
          } else if (functionName === 'find_asset') {
            functionResult = await this.findAssetData(args.query);
          } else if (functionName === 'get_unassigned_assets') {
            functionResult = await this.getUnassignedAssetsData();
          }

          messages.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: functionName,
            content: JSON.stringify(functionResult),
          });
        }

        const secondResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: messages,
        });

        return {
          type: 'markdown',
          text: secondResponse.choices[0].message.content,
        };
      }

      return {
        type: 'markdown',
        text: responseMessage.content,
      };
    } catch (error: any) {
      this.logger.error(`OpenAI error: ${error.message}`, error.stack);
      return {
        type: 'text',
        text: 'Sorry, I encountered an error communicating with the AI service. Please verify your API key and try again.',
      };
    }
  }

  private async getSystemStatsData() {
    const totalAssets = await this.assetRepository.count();
    const totalLicenses = await this.licenseRepository.count();
    const unassignedAssets = await this.assetRepository.count({
      where: { status: AssetStatus.AVAILABLE }
    });
    return { totalAssets, totalLicenses, unassignedAssets };
  }

  private async findAssetData(query: string) {
    if (!query) return { error: 'No query provided' };
    const asset = await this.assetRepository.findOne({
      where: [
        { assetTag: query },
        { serialNumber: query }
      ],
      relations: ['assignedTo']
    });
    if (!asset) return { found: false, message: `No asset found for ${query}` };
    
    return {
      found: true,
      assetTag: asset.assetTag,
      name: asset.name,
      category: asset.category,
      status: asset.status,
      assignedTo: asset.assignedTo ? `${asset.assignedTo.firstName} ${asset.assignedTo.lastName}` : 'Unassigned',
      location: asset.location || 'Unknown',
      serialNumber: asset.serialNumber,
    };
  }

  private async getUnassignedAssetsData() {
    const count = await this.assetRepository.count({
      where: { status: AssetStatus.AVAILABLE }
    });
    return { unassignedCount: count };
  }
}
