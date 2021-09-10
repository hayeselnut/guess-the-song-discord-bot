import { MessageEmbed } from 'discord.js';

import { GuildConfig } from '../types/game';
import { ValidMessage } from '../types/discord';
import { parseMessage, sendEmbed } from '../helpers/bot-helpers';

import Help from '../assets/help.json';
import DefaultConfig from '../assets/default-config.json';
import db from '../db/db';

export default class ConfigManager {
  constructor(
    private readonly guildId: string,
    private guildConfig: GuildConfig,
  ) {}

  // Returns a copy of the config to prevent any concurrent changes affecting the returned object
  get config(): GuildConfig {
    return {
      prefix: this.prefix,
      round_duration: this.roundDuration,
      emote_nearly_correct_guesses: this.reactApproxGuesses,
    };
  }

  get prefix(): string {
    return this.guildConfig.prefix;
  }

  get roundDuration(): number {
    return this.guildConfig.round_duration;
  }

  get reactApproxGuesses(): boolean {
    return this.guildConfig.emote_nearly_correct_guesses;
  }

  readConfigCommand(message: ValidMessage) {
    const args = parseMessage(message);

    if (args.length === 1) {
      return this.showConfig(message);
    }

    const configCmd = args[1];
    const parameter = args[2];

    switch (configCmd) {
    case 'reset':
      return this.resetConfig(message);
    case 'prefix':
      return this.setPrefix(parameter, message);
    case 'round_duration':
      return this.setRoundDuration(parameter, message);
    case 'emote_nearly_correct_guesses':
      return this.setReactApproxGuesses(parameter, message);
    default:
      throw new Error(`Unknown config argument ${configCmd}`);
    }
  }

  private showConfig(message: ValidMessage) {
    const kv = Object.entries(this.guildConfig)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const configEmbed = new MessageEmbed()
      .setTitle('Current configurations')
      .setDescription(`\`\`\`${kv}\`\`\``);
    message.channel.send({ embeds: [configEmbed] });
  }

  private resetConfig(message: ValidMessage) {
    this.guildConfig.prefix = DefaultConfig.prefix;
    this.guildConfig.round_duration = DefaultConfig.round_duration;
    this.guildConfig.emote_nearly_correct_guesses = DefaultConfig.emote_nearly_correct_guesses;
    this.updateDatabase();
    sendEmbed(message.channel, `Configs have been reset`);
  }

  private setPrefix(value: string | undefined, message: ValidMessage) {
    if (typeof value !== 'string') {
      const prefixCmd = Help.commands['config prefix'];
      throw new Error(`Usage: \`${this.prefix}${prefixCmd.usage}\``);
    }

    this.guildConfig.prefix = value;
    this.updateDatabase();
    sendEmbed(message.channel, `Prefix has been set to \`${this.prefix}\``);
  }

  private setRoundDuration(value: string | undefined, message: ValidMessage) {
    const newRoundDuration = parseInt(String(value), 10);
    if (isNaN(newRoundDuration) || newRoundDuration < 5) {
      const roundDurationCmd = Help.commands['config round_duration'];
      throw new Error(`Usage: \`${this.prefix}${roundDurationCmd.usage}\`\n${roundDurationCmd.description}`);
    }

    this.guildConfig.round_duration = newRoundDuration;
    this.updateDatabase();
    sendEmbed(message.channel, `Round duration has been set to \`${this.roundDuration}\``);
  }

  private setReactApproxGuesses(value: string | undefined, message: ValidMessage) {
    if (value === '1' || value === 'true') {
      this.guildConfig.emote_nearly_correct_guesses = true;
      this.updateDatabase();
      sendEmbed(message.channel, `Reacting to nearly correct guesses has been turned on`);
      return;
    }

    if (value === '0' || value === 'false') {
      this.guildConfig.emote_nearly_correct_guesses = false;
      this.updateDatabase();
      sendEmbed(message.channel, `Reacting to nearly correct guesses has been turned off`);
      return;
    }

    const reactApproxGuessesCmd = Help.commands['config emote_nearly_correct_guesses'];
    throw new Error(`Usage: \`${this.prefix}${reactApproxGuessesCmd.usage}\`\n${reactApproxGuessesCmd.description}`);
  }

  private updateDatabase() {
    db.collection('guilds').doc(this.guildId).set({
      prefix: this.prefix,
      round_duration: this.roundDuration,
      emote_nearly_correct_guesses: this.guildConfig.emote_nearly_correct_guesses,
    }, { merge: true });
  }
};
