# Rains

With this set of command you can do rains. Rains basically as the name suggest, rain a specified amount of CCX over specified number of users selected by certain criteria. The possible criteria for selection are:

1. Select all users that recently posted something. In order of latest first.
2. Select users by number of posts over their whole lifespan. The ones with most posts come first
3. Select users by number of posts in certain period. Period starts when an admin resets the period counters.

You need to have a CCX wallet registered with the Bot in order to be able to do rains. You also need enough balance in the wallet to be able to rain the amount you specified.

## Rain by recent activity

>.rain recent &#60;ammount&#62; &#60;users&#62;

#### Parameters

* **ammount**: Means the amount of CCX used for the rain. It will be equaly distributed among the users.
* **users**: specifies the number of users upon which we will rain CCX.

#### Example of use

>.rain recent 10CCX 50u

## Rain by alltime activity

>.rain alltime &#60;ammount&#62; &#60;users&#62;

#### Parameters

* **ammount**: Means the amount of CCX used for the rain. It will be equaly distributed among the users.
* **users**: specifies the number of users upon which we will rain CCX.

#### Example of use

>.rain alltime 10CCX 50u

## Rain by period activity

>.rain period &#60;ammount&#62; &#60;users&#62;

#### Parameters

* **ammount**: Means the amount of CCX used for the rain. It will be equaly distributed among the users.
* **users**: specifies the number of users upon which we will rain CCX.

#### Example of use

>.rain period 10CCX 50u

## Reseting the period

>.rain reset

Resets the current period. Puts counters of all users to 0.

#### Parameters

This command has no additional parameters.

#### Example of use

>.rain reset
