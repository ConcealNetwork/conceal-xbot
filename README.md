# conceal-xbot

Conceal XBOT is a bot made specifically for Conceal public Discord server. While it has features that other projects could use its tied in some places to CCX infrastructure.

The Bot is organized in multiple sections based on the content it serves. A lot of them require the user to have a CCX wallet registered with the bot, so make sure you register one if you want to use its full potential. The command that the bot supports can be distributed in the following sections:

## general

These are general commands that do not fall into any specific category. Click on the command to see how to use it.

| Command  | Description |
| ------------- | ------------- |
| .help  | Shows you this help content. |
| .tip  | Tip a user that also has a registered wallet. |
| .say | Makes the bot say something as if he said it. |
| .purge | Purges last N messages from the channel.  |

## markets

These are commands that enable the user to see market data related to CCX. Click on the command to see how to use it.

| Command  | Description |
| ------------- | ------------- |
| .markets help  | Gives detailed info on markets commands. |
| .markets info  | Gives general info about the markets. |
| .markets info  | Gives CCX price chart for last 7 days. |

## exchanges

These are commands that enable the user to see exchanges info related to CCX. Click on the command to see how to use it.

| Command  | Description |
| ------------- | ------------- |
| .exchanges help  | Gives detailed info on exchanges commands. |
| .exchanges info  | Gives general info about the exchanges. |

## pools

These are commands that enable the user to see pools info. Click on the command to see how to use it.

| Command  | Description |
| ------------- | ------------- |
| .pools help  | Gives detailed info on pools commands. |
| .pools list  | Gives the list of all CCX pools. |
| .pools info  | Gives the info about all CCX pools. |

## users

These are commands that enable the user to all the info related to CCX Discord server users. Click on the command to see how to use it.

| Command  | Description |
| ------------- | ------------- |
| .users help  | Gives detailed info on users commands. |
| .users all  | Counts all users on the server. |
| .users online  | Counts all online users on the server. |
| .users offline  | Counts all offline users on the server. |
| .users ban  | Bans a user from the server. |
| .users kick  | Kicks a user from the server. |

## blockchain

These are commands that enable the user to see CCX blockchain related info. Click on the command to see how to use it.
Instead of **.blockchain** you can use **.chain** as a shorter version

| Command  | Description |
| ------------- | ------------- |
| .blockchain help  | Gives detailed info on blockchain commands. |
| .blockchain supply  | Gives the current circulating supply of CCX. |
| .blockchain height  | Gives the current blockchain height. |
| .blockchain reward  | Gives the current block reward. |
| .blockchain hashrate  | Gives the current hashrate of the network. |
| .blockchain totalsupply  | Gives the current total supply. |
| .blockchain maxsupply  | Gives the max supply of CCX. |
| .blockchain difficulty  | Gives the current difficulty of the network. |

## giveaway

These are commands related to giveaways. You need to have a CCX wallet registered with the Bot in order to use them. Click on the command to see how to use it.

| Command  | Description |
| ------------- | ------------- |
| [.giveaway help](https://github.com/ConcealNetwork/conceal-xbot/blob/master/docs/giveaways.md#giveaways) | Gives detailed info on giveaway commands. |
| [.giveaway create](https://github.com/ConcealNetwork/conceal-xbot/blob/master/docs/giveaways.md#creating-a-giveaway) | Creates a new giveaway based on parameters. |
| [.giveaway list](https://github.com/ConcealNetwork/conceal-xbot/blob/master/docs/giveaways.md#listing-all-active-giveaways) | Lists all active giveaways. |
| [.giveaway delete](https://github.com/ConcealNetwork/conceal-xbot/blob/master/docs/giveaways.md#deleting-a-giveaway) | Deletes an active giveaway. |

## rain

These are commands related to rains. You need to have a CCX wallet registered with the Bot in order to use them. Click on the command to see how to use it.

| Command  | Description |
| ------------- | ------------- |
| [.rain help](https://github.com/ConcealNetwork/conceal-xbot/blob/master/docs/rains.md#rains) | Gives detailed info on rain commands. |
| [.rain recent](https://github.com/ConcealNetwork/conceal-xbot/blob/master/docs/rains.md#rain-by-recent-activity) | Rains upon the users that were active recently. |
| [.rain alltime](https://github.com/ConcealNetwork/conceal-xbot/blob/master/docs/rains.md#rain-by-alltime-activity) | Rains upon the all time most active users. |
| [.rain period](https://github.com/ConcealNetwork/conceal-xbot/blob/master/docs/rains.md#rain-by-period-activity) | Rains upon the users that are most active in the last period. |
| [.rain reset](https://github.com/ConcealNetwork/conceal-xbot/blob/master/docs/rains.md#reseting-the-period) | Resets the current recent period to 0. |

## wallet

These are commands related to your wallet. You need to have a CCX wallet registered with the Bot in order to use them. Click on the command to see how to use it.

| Command  | Description |
| ------------- | ------------- |
| [.wallet help](https://github.com/ConcealNetwork/conceal-xbot/blob/master/docs/wallet.md#wallet) | Gives detailed info on wallet commands. |
| [.wallet register](https://github.com/ConcealNetwork/conceal-xbot/blob/master/docs/wallet.md#register-a-wallet) | Registers a new wallet for the user. You need to specify a valid CCX address. |
| [.wallet update](https://github.com/ConcealNetwork/conceal-xbot/blob/master/docs/wallet.md#update-your-wallet) | Updates the current user wallet with new CCX address. |
| [.wallet show](https://github.com/ConcealNetwork/conceal-xbot/blob/master/docs/wallet.md#show-your-wallet-info) | Gives the current wallet details for the user to DM. |
| [.wallet deposit](https://github.com/ConcealNetwork/conceal-xbot/blob/master/docs/wallet.md#showing-how-to-deposit) | Gives the user info about how to deposit to his/her wallet. |
| [.wallet withdraw](https://github.com/ConcealNetwork/conceal-xbot/blob/master/docs/wallet.md#withdraw-your-funds) | Allows you to withdraw your funds back to your wallet. |
| [.wallet balance](https://github.com/ConcealNetwork/conceal-xbot/blob/master/docs/wallet.md#showing-your-wallet-balance) | Shows the current user wallet balance. |
| [.wallet paymentid](https://github.com/ConcealNetwork/conceal-xbot/blob/master/docs/wallet.md#generating-a-payment-id) | Generates a paymentId. |

## social

These commands allow you to access social media links related to Conceal Network. Click on the command to see how to use it.

| Command | Description |
|---------|-------------|
| .social help | Shows detailed info on social commands. |
| .social latest | Displays the latest 3 tweets from the Conceal Network Twitter account. |
| .social tweet <id> | Provides the URL for a specific tweet by ID. |

## mining

These commands provide information and calculations related to CCX mining. These commands are only available in designated mining channels. Click on the command to see how to use it.

| Command | Description |
|---------|-------------|
| .mining help | Shows detailed info on mining commands. |
| .mining difficulty | Shows the current network difficulty. |
| .mining oc <platform> | Shows overclocking settings for GPUs. |
| .mining list <platform> | Lists available GPUs for mining. |
| .mining rig <qty> <gpu> ... | Calculates hashrate and expected reward for a rig. |

