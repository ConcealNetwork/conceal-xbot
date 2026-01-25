const fs = require('fs');
const Numeral = require('numeral');
const axios = require('axios');
const config = require('../config.json');
const utils = require('../helpers/utils.js');
const BlockchainData = require('../modules/blockchain.js');
const calculation = require('../helpers/calculation.js');

const blockchain = new BlockchainData();

function executeCommand(message, command, args) {
  // Handle help command
  if (args.length > 0 && args[0] === 'help') {
    fs.readFile('./templates/help_mining.msg', 'utf8', function (err, source) {
      if (err) throw err;
      utils.sendHelpContent(message, source);
    });
    return;
  }

  // Check channel restriction
  const allowedChannels = config.mining.channels;
  if (!allowedChannels.includes(message.channel.id)) {
    return message.reply('Mining commands are only available in designated mining channels.');
  }

  // Handle .mining oc
  if (args.length > 0 && args[0] === 'oc') {
    if (args.length === 1) {
      return message.reply('Available platforms: nvidia, amd');
    }
    const platform = args[1].toLowerCase();
    if (platform !== 'nvidia' && platform !== 'amd') {
      return message.reply('Invalid platform. Use nvidia or amd.');
    }
    if (args.length === 2) {
      // List all OC for platform
      const gpus = calculation.getAllGpus(platform);
      const table = calculation.formatOcTable(gpus);
      return message.reply(`Overclocking settings for ${platform.toUpperCase()} GPUs:\n\n${table}`);
    } else {
      // Specific GPU
      const gpuName = args.slice(2).join(' ').toLowerCase();
      const gpu = calculation.getGpuInfo(platform, gpuName);
      if (!gpu) {
        return message.reply(`GPU '${gpuName}' not found in ${platform} list.`);
      }
      return message.reply(`Overclocking for ${gpu.name}:\nCore Clock: ${gpu.cc}\nMemory Clock: ${gpu.mc}\nPower Limit: ${gpu.pl}`);
    }
  }

  // Handle .mining list
  if (args.length > 0 && args[0] === 'list') {
    if (args.length === 1) {
      return message.reply('Specify platform: amd or nvidia');
    }
    const platform = args[1].toLowerCase();
    if (platform !== 'nvidia' && platform !== 'amd') {
      return message.reply('Invalid platform. Use nvidia or amd.');
    }
    const gpus = calculation.getAllGpus(platform);
    const list = calculation.formatGpuList(gpus);
    return message.reply(`Available ${platform.toUpperCase()} GPUs: ${list}`);
  }

  // Handle .mining difficulty
  if (args.length > 0 && args[0] === 'difficulty') {
    axios.get('https://explorer.conceal.network/q/difficulty/')
      .then(response => {
        const difficulty = Numeral(parseFloat(response.data)).format('0.00a');
        message.reply(`Current network difficulty: ${difficulty}`);
      })
      .catch(err => {
        console.error(err);
        message.reply('Error fetching difficulty data.');
      });
    return;
  }

  // Handle .mining rig
  if (args.length > 0 && args[0] === 'rig') {
    if (args.length < 3 || args.length % 2 !== 1) {
      return message.reply('Usage: .mining rig qty0 gpu0 qty1 gpu1 ... (up to 6 GPUs)\n**Important:** GPU names must be concatenated (no spaces). Examples: `4060Ti`, `RTX4060ti`, `RX6600XT`');
    }
    const rig = [];
    for (let i = 1; i < args.length; i += 2) {
      const qty = parseInt(args[i]);
      const gpuName = args[i + 1];
      
      // Validate quantity is a number
      if (isNaN(qty) || qty <= 0) {
        return message.reply(`Invalid quantity: ${args[i]}\n**Note:** GPU names must be concatenated (no spaces). Use \`4060Ti\` not \`4060 Ti\``);
      }
      
      // Validate GPU name doesn't contain spaces (user must concatenate)
      if (gpuName.includes(' ')) {
        return message.reply(`GPU name "${gpuName}" contains spaces. Please concatenate: use \`${gpuName.replace(/\s+/g, '')}\` instead of \`${gpuName}\`\nExample: \`4060Ti\` not \`4060 Ti\``);
      }
      
      // Search both platforms - the matching function will find the correct GPU
      let gpu = null;
      let platform = null;
      
      // Try NVIDIA first, then AMD
      gpu = calculation.getGpuInfo('nvidia', gpuName);
      if (gpu) {
        platform = 'nvidia';
      } else {
        gpu = calculation.getGpuInfo('amd', gpuName);
        if (gpu) {
          platform = 'amd';
        }
      }
      
      // Validate GPU exists
      if (!gpu) {
        const allNvidia = calculation.formatGpuList(calculation.getAllGpus('nvidia'));
        const allAmd = calculation.formatGpuList(calculation.getAllGpus('amd'));
        return message.reply(`GPU '${gpuName}' not found.\nAvailable NVIDIA GPUs: ${allNvidia}\nAvailable AMD GPUs: ${allAmd}`);
      }
      rig.push({ qty, gpuName, platform });
    }
    if (rig.length > 6) {
      return message.reply('Maximum 6 GPUs supported.');
    }

    const totalHash = calculation.calculateTotalHashrate(rig);
    if (totalHash === 0) {
      return message.reply('No valid GPUs found.');
    }

    // Calculate total power consumption (excluding N/A)
    const totalPower = calculation.calculateTotalPower(rig);

    // Fetch network hashrate and block reward from explorer endpoints
    Promise.all([
      axios.get('https://explorer.conceal.network/q/hashrate/'),
      axios.get('https://explorer.conceal.network/q/reward/')
    ]).then(([hashrateResponse, rewardResponse]) => {
      const networkHash = parseFloat(hashrateResponse.data); // Network hashrate in H/s
      const blockReward = parseFloat(rewardResponse.data); // Block reward in CCX
      // totalHash is in kH/s, pass it directly to calculateExpectedReward
      const expectedReward = calculation.calculateExpectedReward(totalHash, networkHash, blockReward);
      const formattedHash = Numeral(totalHash).format('0.00');
      const formattedReward = Numeral(expectedReward).format('0.0000');
      const formattedPower = Numeral(totalPower).format('0');
      
      let response = `Rig hashrate: ${formattedHash} kH/s\nExpected daily reward: ${formattedReward} CCX`;
      if (totalPower > 0) {
        response += `\nPower consumption: ${formattedPower} W`;
      }
      message.reply(response);
    }).catch(err => {
      console.error(err);
      message.reply('Error fetching blockchain data.');
    });
    return;
  }

  // Unknown command
  message.reply('Unknown mining command. Type ".mining help" for available commands.');
}

module.exports = {
  executeCommand
};