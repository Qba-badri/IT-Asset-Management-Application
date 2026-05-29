import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset, AssetStatus } from '../../entities/asset.entity';
import { License } from '../../entities/license.entity';
import { SettingsService } from '../settings/settings.service';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';

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
    const providerSetting = await this.settingsService.getSetting('AI_PROVIDER');
    const provider = providerSetting || 'openai';

    try {
      if (provider === 'openai') {
        return await this.processOpenAI(message);
      } else if (provider === 'claude') {
        return await this.processClaude(message);
      } else if (provider === 'gemini') {
        return await this.processGemini(message);
      } else {
        return { type: 'markdown', text: `Unknown AI provider: ${provider}` };
      }
    } catch (error: any) {
      this.logger.error(`AI Engine Error [${provider}]: ${error.message}`, error.stack);
      return {
        type: 'markdown',
        text: `Sorry, I encountered an error communicating with **${provider.toUpperCase()}**.\n\n**Error Details:** \`${error.message}\`\n\nPlease verify your API key in System Settings or check your provider account quota.`,
      };
    }
  }

  // =========================================================================
  // OPENAI IMPLEMENTATION
  // =========================================================================
  private async processOpenAI(message: string) {
    const apiKey = await this.settingsService.getSetting('OPENAI_API_KEY');
    if (!apiKey) return this.missingKeyError('OpenAI');

    const openai = new OpenAI({ apiKey });
    
    const tools: any = [
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
            properties: { query: { type: 'string', description: 'The asset tag or serial number' } },
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: this.getSystemPrompt() },
        { role: 'user', content: message }
      ],
      tools,
      tool_choice: 'auto',
    });

    const responseMessage = completion.choices[0].message;

    if (responseMessage.tool_calls) {
      const messages: any[] = [
        { role: 'system', content: this.getSystemPrompt() },
        { role: 'user', content: message },
        responseMessage,
      ];

      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.type !== 'function') continue;
        const functionName = (toolCall as any).function.name;
        const args = JSON.parse((toolCall as any).function.arguments);
        const functionResult = await this.executeTool(functionName, args);

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

      return { type: 'markdown', text: secondResponse.choices[0].message.content };
    }

    return { type: 'markdown', text: responseMessage.content };
  }

  // =========================================================================
  // ANTHROPIC CLAUDE IMPLEMENTATION
  // =========================================================================
  private async processClaude(message: string) {
    const apiKey = await this.settingsService.getSetting('CLAUDE_API_KEY');
    if (!apiKey) return this.missingKeyError('Anthropic Claude');

    const anthropic = new Anthropic({ apiKey });

    const tools: any = [
      {
        name: 'get_system_stats',
        description: 'Get high-level statistics about total assets, total licenses, and unassigned assets.',
        input_schema: { type: 'object', properties: {} },
      },
      {
        name: 'find_asset',
        description: 'Find details of a specific asset by its asset tag or serial number.',
        input_schema: {
          type: 'object',
          properties: { query: { type: 'string', description: 'The asset tag or serial number' } },
          required: ['query'],
        },
      },
      {
        name: 'get_unassigned_assets',
        description: 'Get a count of all unassigned (In Stock) assets ready for deployment.',
        input_schema: { type: 'object', properties: {} },
      }
    ];

    const msg = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: this.getSystemPrompt(),
      tools,
      messages: [{ role: 'user', content: message }]
    });

    if (msg.stop_reason === 'tool_use') {
      const toolCall = msg.content.find((c: any) => c.type === 'tool_use') as any;
      if (toolCall) {
        const functionResult = await this.executeTool(toolCall.name, toolCall.input);
        
        const secondMsg = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: this.getSystemPrompt(),
          tools,
          messages: [
            { role: 'user', content: message },
            { role: 'assistant', content: msg.content },
            {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolCall.id,
                  content: JSON.stringify(functionResult)
                }
              ]
            }
          ]
        });
        return { type: 'markdown', text: (secondMsg.content[0] as any).text };
      }
    }

    return { type: 'markdown', text: (msg.content[0] as any).text };
  }

  // =========================================================================
  // GOOGLE GEMINI IMPLEMENTATION
  // =========================================================================
  private async processGemini(message: string) {
    const apiKey = await this.settingsService.getSetting('GEMINI_API_KEY');
    if (!apiKey) return this.missingKeyError('Google Gemini');

    const ai = new GoogleGenAI({ apiKey });

    const tools: any = [{
      functionDeclarations: [
        {
          name: 'get_system_stats',
          description: 'Get high-level statistics about total assets, total licenses, and unassigned assets.',
          parameters: { type: 'OBJECT', properties: {} }
        },
        {
          name: 'find_asset',
          description: 'Find details of a specific asset by its asset tag or serial number.',
          parameters: {
            type: 'OBJECT',
            properties: { query: { type: 'STRING', description: 'The asset tag or serial number' } },
            required: ['query'],
          }
        },
        {
          name: 'get_unassigned_assets',
          description: 'Get a count of all unassigned (In Stock) assets ready for deployment.',
          parameters: { type: 'OBJECT', properties: {} }
        }
      ]
    }];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction: this.getSystemPrompt(),
        tools
      }
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      const args = call.args || {};
      const functionResult = await this.executeTool(call.name, args);

      const secondResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: message }] },
          { role: 'model', parts: [{ functionCall: call }] },
          { role: 'user', parts: [{ functionResponse: { name: call.name, response: functionResult } }] }
        ],
        config: { systemInstruction: this.getSystemPrompt(), tools }
      });

      return { type: 'markdown', text: secondResponse.text };
    }

    return { type: 'markdown', text: response.text };
  }

  // =========================================================================
  // UTILS & DB OPERATIONS
  // =========================================================================

  private getSystemPrompt() {
    return 'You are an IT Asset Management (ITAM) assistant bot. You help administrators query asset information. Format your responses in clean Markdown. Use tables or lists when appropriate.';
  }

  private missingKeyError(providerName: string) {
    return {
      type: 'markdown',
      text: `⚠️ **${providerName} API Key not configured.**\n\nPlease configure the \`${providerName.toUpperCase()}_API_KEY\` in the System Settings (Admin -> System Settings).`,
    };
  }

  private async executeTool(name: string, args: any) {
    if (name === 'get_system_stats') return await this.getSystemStatsData();
    if (name === 'find_asset') return await this.findAssetData(args.query);
    if (name === 'get_unassigned_assets') return await this.getUnassignedAssetsData();
    return { error: `Unknown tool ${name}` };
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
