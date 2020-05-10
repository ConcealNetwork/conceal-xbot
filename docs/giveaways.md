# Giveaways

With this set of command you can create, list and delete giveaways. A giveaway is automated and it finishes when the timespan specified expires. Basically the flow of the giveaway is the following:

1. Create a new giveaway with correct parameters
2. In the lifespan of the giveaway any user can click the rection under it and as such be part of the giveaway lottery.
3. When the giveaway timespan exipired the giveaway is finished and winners are randomly selected among the participants.

You need to have a CCX wallet registered with the Bot in order to be able to create a giveaway. You also need enough balance in the wallet as the amount you want to give as a reward is locked when you create the giveaway.

## Creating a giveaway

.giveaway create &#60;timespan&#62; &#60;winners&#62; &#60;ammount&#62; &#60;title&#62;

#### Parameters

* **timespan**: Specifies how long the giveaway will last. If not specified otherwise its in seconds, but it supports other time formats. Examples:
  * 10: Means 10 seconds
  * 10m: means 10 minuts
  * 10h: means 10 hours
  * 10d: means 10 days
* **winners**: specifies the number of winners that are randomly selected from all participants.
* **amount**: Means the amount of CCX used for the giveaway. It will be equaly distributed among the winners.
* **title** The title of the giveaway for easier management.

#### Example of use

.giveaway create 1h 3w 100CCX Random Giveaway

## Listing all active giveaways

.giveaway list

#### Parameters

This command has no additional parameters.

#### Example of use

.giveaway list

## Deleting a giveaway

.giveaway delete &#60;id&#62;

#### Parameters

* **id**: id of the giveaway you want to delete. You need to be admin or owner of the giveaway. Use **list** command to get the id.

#### Example of use

.giveaway delete 5
